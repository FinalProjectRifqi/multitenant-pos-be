import type { Logger } from 'pino';
import { randomBytes } from 'node:crypto';
import type { AppConfig } from '../../config';
import { AppError } from '../../common/errors/app-error';
import { ErrorCodes } from '../../common/errors/error-codes';
import type { JwtTokenPayload } from '../auth/models/auth.model';
import { authForbiddenError } from '../auth/errors/auth.errors';
import { unitNotFoundError } from '../business-units/errors/business-unit.errors';
import type { CreateOrderDto } from './dto/create-order.dto';
import type { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import type { ListTransactionHistoryQueryDto } from './dto/list-transaction-history-query.dto';
import type {
  UpdateOrderDto,
  UpdateOrderItemInputDto,
} from './dto/update-order.dto';
import {
  orderAlreadyCompletedError,
  orderAlreadyCancelledError,
  orderCannotBeCancelledError,
  orderItemNotFoundError,
  orderMenuNotAvailableError,
  orderMenuNotInUnitError,
  orderNotFoundError,
  orderPriceMismatchError,
  orderStatusNotFoundError,
  orderTypeNotFoundError,
} from './errors/order.errors';
import type {
  MenuItemLookupRow,
  OrderCancelApiResponse,
  OrderCreateApiResponse,
  OrderDetailApiResponse,
  OrderDetailResponse,
  OrderItemResponse,
  OrderItemRow,
  OrderListApiResponse,
  OrderRow,
  OrderTransactionHistoryApiResponse,
  OrderTransactionHistoryRow,
  OrderUpdateApiResponse,
} from './models/order.model';
import type {
  IOrderRepository,
  OrderSortByColumn,
  OrderTransactionHistorySortByColumn,
  UpdateOrderData,
} from './repositories/order.repository';
import {
  assertGeneralOrderStatusTransition,
  resolveStatusCode,
} from './order-status-transition';
import {
  mapOrderDetailResponse,
  mapOrderItemResponse,
} from './order-response.mapper';

// Differences <= 1 rupiah are accepted to handle floating-point rounding
const PRICE_TOLERANCE = 1;
const ORDER_NUMBER_RANDOM_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

const ALL_UNIT_ROLE_CODES = [
  'director',
  'owner',
  'super_admin',
  'admin_grup',
  'manajemen_grup',
  'manajemen_group',
  'group_management',
  'group_manager',
];

export class OrderService {
  constructor(
    private readonly repository: IOrderRepository,
    private readonly config: AppConfig,
    private readonly logger: Logger,
  ) {}

  // ===========================
  // List Orders
  // ===========================

  async listOrders(
    unitId: string,
    query: ListOrdersQueryDto,
  ): Promise<OrderListApiResponse> {
    try {
      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const sortBy =
        (query.sortBy as OrderSortByColumn | undefined) ?? 'ordered_at';
      const sortType = query.sortType ?? 'DESC';
      const statusId = query.status_id;

      this.logger.info(
        { unitId, page, limit, sortBy, sortType, statusId },
        'Fetching orders list',
      );

      const unit = await this.repository.findUnitById(unitId);
      if (!unit) {
        this.logger.warn({ unitId }, 'Orders list failed - unit not found');
        throw unitNotFoundError();
      }

      const { data, total } = await this.repository.findAll({
        unitId,
        statusId,
        page,
        limit,
        sortBy,
        sortType,
      });

      const totalPages = Math.ceil(total / limit);

      this.logger.info(
        { unitId, total, page, limit },
        'Orders list fetched successfully',
      );

      return {
        success: true,
        statusCode: 200,
        message: 'Data order berhasil diambil',
        data: data.map((row) => this.mapToListItemResponse(row)),
        meta: { page, limit, total, totalPages },
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        { err: error, unitId },
        'Unexpected error while fetching orders list',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  async listTransactionHistory(
    unitId: string,
    query: ListTransactionHistoryQueryDto,
    user: JwtTokenPayload,
  ): Promise<OrderTransactionHistoryApiResponse> {
    try {
      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const sortBy =
        (query.sortBy as OrderTransactionHistorySortByColumn | undefined) ??
        'ordered_at';
      const sortType = query.sortType ?? 'DESC';
      const statusId = query.status_id;
      const dateFrom = this.parseOptionalDate(query.date_from, 'date_from');
      const dateTo = this.parseOptionalDate(query.date_to, 'date_to', true);
      const paymentMethod = query.payment_method;
      const search =
        query.search && query.search.trim().length > 0
          ? query.search.trim()
          : undefined;

      this.assertDateRange(dateFrom, dateTo);

      this.logger.info(
        {
          unitId,
          userId: user.sub,
          role: user.roles,
          page,
          limit,
          sortBy,
          sortType,
          statusId,
          dateFrom,
          dateTo,
          paymentMethod,
          search,
        },
        'Fetching transaction history',
      );

      const unit = await this.repository.findUnitById(unitId);
      if (!unit) {
        this.logger.warn(
          { unitId, userId: user.sub },
          'Transaction history failed - unit not found',
        );
        throw unitNotFoundError();
      }

      await this.assertCanAccessTransactionHistory(unitId, user);

      const { data, total } = await this.repository.findTransactionHistory({
        unitId,
        statusId,
        dateFrom,
        dateTo,
        paymentMethod,
        search,
        page,
        limit,
        sortBy,
        sortType,
      });

      const totalPages = Math.ceil(total / limit);

      this.logger.info(
        { unitId, userId: user.sub, total, page, limit },
        'Transaction history fetched successfully',
      );

      return {
        success: true,
        statusCode: 200,
        message: 'Riwayat transaksi berhasil diambil',
        data: data.map((row) => this.mapToTransactionHistoryResponse(row)),
        meta: { page, limit, total, totalPages },
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        { err: error, unitId, userId: user.sub },
        'Unexpected error while fetching transaction history',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  // ===========================
  // Get Order By ID
  // ===========================

  async getOrderById(
    unitId: string,
    orderId: string,
  ): Promise<OrderDetailApiResponse> {
    try {
      this.logger.info({ unitId, orderId }, 'Fetching order detail');

      const unit = await this.repository.findUnitById(unitId);
      if (!unit) {
        this.logger.warn({ unitId }, 'Order detail failed - unit not found');
        throw unitNotFoundError();
      }

      const order = await this.repository.findById(unitId, orderId);
      if (!order) {
        this.logger.warn(
          { unitId, orderId },
          'Order detail failed - order not found',
        );
        throw orderNotFoundError();
      }

      const items = await this.repository.findOrderItemsByOrderId(orderId);

      this.logger.info(
        { unitId, orderId },
        'Order detail fetched successfully',
      );

      return {
        success: true,
        statusCode: 200,
        message: 'Detail order berhasil diambil',
        data: this.mapToDetailResponse(order, items),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        { err: error, unitId, orderId },
        'Unexpected error while fetching order detail',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  // ===========================
  // Create Order
  // ===========================

  async createOrder(
    unitId: string,
    userId: string,
    dto: CreateOrderDto,
  ): Promise<OrderCreateApiResponse> {
    try {
      this.logger.info(
        { unitId, userId, customerName: dto.customer_name },
        'Creating order',
      );

      // 1. Validate unit exists
      const unit = await this.repository.findUnitById(unitId);
      if (!unit) {
        this.logger.warn({ unitId }, 'Order creation failed - unit not found');
        throw unitNotFoundError();
      }

      // 2. Validate order type exists
      const orderType = await this.repository.findOrderTypeById(
        dto.order_type_id,
      );
      if (!orderType) {
        this.logger.warn(
          { unitId, orderTypeId: dto.order_type_id },
          'Order creation failed - order type not found',
        );
        throw orderTypeNotFoundError();
      }

      // 3. Determine dine-in and validate table_number
      const isDineIn = this.isDineInType(orderType.order_type_name);
      this.validateTableNumber(isDineIn, dto.table_number);
      const tableNumber = isDineIn ? (dto.table_number ?? null) : null;

      // 4. Merge duplicate menu_item_ids (sum quantities, last occurrence wins for price/notes)
      const mergedItems = this.mergeOrderItems(dto.items);

      // 5. Fetch menu items from DB and validate each
      const menuItemIds = mergedItems.map((i) => i.menu_item_id);
      const menuRows = await this.repository.findMenuItemsByIds(
        menuItemIds,
        unitId,
      );
      this.validateMenuItems(mergedItems, menuRows, unitId);

      // 6. Validate pricing
      const calculatedSubtotal = this.calculateSubtotal(mergedItems);
      this.validatePricing(
        calculatedSubtotal,
        dto.subtotal,
        dto.tax_amount,
        dto.total_amount,
      );

      // 7. Generate order number: ORD-XXXXXX
      const orderNumber = this.generateOrderNumber();

      this.logger.info({ unitId, orderNumber }, 'Generated order number');

      // 8. Create order + items in transaction
      const { order_id: orderId } = await this.repository.transaction(
        async (trx) => {
          const created = await this.repository.create(
            {
              unit_id: unitId,
              user_id: userId,
              order_number: orderNumber,
              order_type_id: dto.order_type_id,
              order_status_id: this.config.order.pendingStatusUuid,
              customer_name: dto.customer_name,
              table_number: tableNumber,
              notes: dto.notes ?? null,
              subtotal: dto.subtotal,
              tax_amount: dto.tax_amount,
              total_amount: dto.total_amount,
            },
            trx,
          );

          await this.repository.createOrderItems(
            mergedItems.map((item) => ({
              order_id: created.order_id,
              menu_item_id: item.menu_item_id,
              quantity: item.quantity,
              item_price: item.item_price,
              notes: item.notes ?? null,
            })),
            trx,
          );

          return created;
        },
      );

      // 9. Fetch full order + items for response
      const order = await this.repository.findById(unitId, orderId);
      const items = await this.repository.findOrderItemsByOrderId(orderId);

      this.logger.info(
        { unitId, orderId, orderNumber },
        'Order created successfully',
      );

      return {
        success: true,
        statusCode: 201,
        message: 'Order berhasil dibuat',
        data: this.mapToDetailResponse(order!, items),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        { err: error, unitId, userId },
        'Unexpected error while creating order',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  // ===========================
  // Update Order
  // ===========================

  async updateOrder(
    unitId: string,
    orderId: string,
    dto: UpdateOrderDto,
  ): Promise<OrderUpdateApiResponse> {
    try {
      this.logger.info({ unitId, orderId }, 'Updating order');

      // 1. Validate unit exists
      const unit = await this.repository.findUnitById(unitId);
      if (!unit) {
        this.logger.warn({ unitId }, 'Order update failed - unit not found');
        throw unitNotFoundError();
      }

      // 2. Fetch existing order
      const existingOrder = await this.repository.findById(unitId, orderId);
      if (!existingOrder) {
        this.logger.warn(
          { unitId, orderId },
          'Order update failed - order not found',
        );
        throw orderNotFoundError();
      }

      // 3. Resolve current status for transition validation
      const currentStatusValue =
        existingOrder.order_status_code ?? existingOrder.order_status_name;

      if (!currentStatusValue) {
        throw orderStatusNotFoundError();
      }

      const currentStatusCode = resolveStatusCode(currentStatusValue);

      if (currentStatusCode === 'SELESAI') {
        this.logger.warn(
          { unitId, orderId, status: existingOrder.order_status_name },
          'Order update failed - order already completed',
        );
        throw orderAlreadyCompletedError();
      }

      if (currentStatusCode === 'DIBATALKAN') {
        this.logger.warn(
          { unitId, orderId, status: existingOrder.order_status_name },
          'Order update failed - order already cancelled',
        );
        throw orderAlreadyCancelledError();
      }

      // 4. Require at least one field to change
      const hasHeaderChange =
        dto.order_type_id !== undefined ||
        dto.order_status_id !== undefined ||
        dto.customer_name !== undefined ||
        dto.table_number !== undefined ||
        dto.notes !== undefined;
      const hasItemsChange = dto.items !== undefined && dto.items.length > 0;

      if (!hasHeaderChange && !hasItemsChange) {
        throw new AppError({
          code: ErrorCodes.ValidationFailed,
          message: 'Minimal satu field harus diisi untuk melakukan pembaruan',
          status: 400,
        });
      }

      // 5. Resolve order type — use incoming if provided, else fall back to existing
      let orderTypeName = existingOrder.order_type_name;
      let resolvedOrderTypeId = existingOrder.order_type_id;

      if (dto.order_type_id !== undefined) {
        const orderType = await this.repository.findOrderTypeById(
          dto.order_type_id,
        );
        if (!orderType) {
          this.logger.warn(
            { unitId, orderId, orderTypeId: dto.order_type_id },
            'Order update failed - order type not found',
          );
          throw orderTypeNotFoundError();
        }
        orderTypeName = orderType.order_type_name;
        resolvedOrderTypeId = orderType.order_type_id;
      }

      const isDineIn = this.isDineInType(orderTypeName);

      // 6. Resolve table_number based on dine-in determination
      let resolvedTableNumber: string | null;
      if (isDineIn) {
        // Use provided value if present, otherwise keep existing
        resolvedTableNumber =
          dto.table_number !== undefined
            ? dto.table_number
            : existingOrder.table_number;

        if (!resolvedTableNumber) {
          throw new AppError({
            code: ErrorCodes.ValidationFailed,
            message: 'Nomor meja wajib diisi untuk tipe order dine-in',
            status: 400,
          });
        }
      } else {
        // Non-dine-in must not carry a table number
        if (
          dto.table_number !== undefined &&
          dto.table_number !== null &&
          dto.table_number !== ''
        ) {
          throw new AppError({
            code: ErrorCodes.ValidationFailed,
            message:
              'Nomor meja tidak diperlukan untuk tipe order selain dine-in',
            status: 400,
          });
        }
        resolvedTableNumber = null;
      }

      let nextStatusId: string | undefined;
      let nextStatusCode: string | undefined;
      let completedAt: Date | undefined;

      if (dto.order_status_id !== undefined) {
        const nextStatus = await this.repository.findOrderStatusById(
          dto.order_status_id,
        );
        if (!nextStatus) {
          this.logger.warn(
            { unitId, orderId, statusId: dto.order_status_id },
            'Order update failed - status not found',
          );
          throw orderStatusNotFoundError();
        }

        nextStatusId = nextStatus.order_status_id;
        nextStatusCode = resolveStatusCode(nextStatus.order_status_code);

        assertGeneralOrderStatusTransition(currentStatusCode, nextStatusCode);

        if (nextStatusCode === 'SELESAI') {
          completedAt = new Date();
        }
      }

      // 7. Process items if provided
      let mergedItems: UpdateOrderItemInputDto[] = [];
      let existingItemRows: OrderItemRow[] = [];

      if (hasItemsChange) {
        mergedItems = this.mergeOrderItems(dto.items!);

        // Validate that every supplied order_item_id belongs to this order
        existingItemRows =
          await this.repository.findOrderItemsByOrderId(orderId);
        const existingItemIdSet = new Set(
          existingItemRows.map((i) => i.order_item_id),
        );

        for (const item of mergedItems) {
          if (
            item.order_item_id !== undefined &&
            !existingItemIdSet.has(item.order_item_id)
          ) {
            this.logger.warn(
              { unitId, orderId, orderItemId: item.order_item_id },
              'Order update failed - order item not found in this order',
            );
            throw orderItemNotFoundError();
          }
        }

        // Validate menus (exist in unit, available, price within tolerance)
        const menuItemIds = mergedItems.map((i) => i.menu_item_id);
        const menuRows = await this.repository.findMenuItemsByIds(
          menuItemIds,
          unitId,
        );
        this.validateMenuItems(mergedItems, menuRows, unitId);

        // subtotal and total_amount are required when items change
        if (dto.subtotal === undefined || dto.total_amount === undefined) {
          throw new AppError({
            code: ErrorCodes.ValidationFailed,
            message:
              'subtotal dan total_amount wajib diisi saat mengubah item order',
            status: 400,
          });
        }

        const submittedTaxAmount = dto.tax_amount ?? existingOrder.tax_amount;
        const calculatedSubtotal = this.calculateSubtotal(mergedItems);
        this.validatePricing(
          calculatedSubtotal,
          dto.subtotal,
          submittedTaxAmount,
          dto.total_amount,
        );
      }

      // 8. Execute update in transaction
      await this.repository.transaction(async (trx) => {
        // Build header update payload — only include explicitly provided fields
        const updateData: UpdateOrderData = {
          ...(dto.order_type_id !== undefined
            ? { order_type_id: resolvedOrderTypeId }
            : {}),
          ...(nextStatusId !== undefined
            ? { order_status_id: nextStatusId }
            : {}),
          ...(dto.customer_name !== undefined
            ? { customer_name: dto.customer_name }
            : {}),
          table_number: resolvedTableNumber,
          ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
          ...(dto.subtotal !== undefined ? { subtotal: dto.subtotal } : {}),
          ...(dto.tax_amount !== undefined
            ? { tax_amount: dto.tax_amount }
            : {}),
          ...(dto.total_amount !== undefined
            ? { total_amount: dto.total_amount }
            : {}),
          ...(completedAt !== undefined ? { completed_at: completedAt } : {}),
        };

        await this.repository.update(orderId, updateData, trx);

        if (hasItemsChange) {
          // Soft-delete existing items that are NOT referenced in the request
          const referencedItemIds = new Set(
            mergedItems
              .filter((i) => i.order_item_id !== undefined)
              .map((i) => i.order_item_id!),
          );

          const itemsToDelete = existingItemRows
            .filter((ei) => !referencedItemIds.has(ei.order_item_id))
            .map((ei) => ei.order_item_id);

          await this.repository.softDeleteOrderItemsByIds(itemsToDelete, trx);

          // Update referenced items or insert new ones
          for (const item of mergedItems) {
            const itemData = {
              menu_item_id: item.menu_item_id,
              quantity: item.quantity,
              item_price: item.item_price,
              notes: item.notes ?? null,
            };

            if (item.order_item_id !== undefined) {
              await this.repository.updateOrderItem(
                item.order_item_id,
                itemData,
                trx,
              );
            } else {
              await this.repository.insertOrderItem(orderId, itemData, trx);
            }
          }
        }
      });

      // 9. Fetch updated order + items for response
      const updatedOrder = await this.repository.findById(unitId, orderId);
      const updatedItems =
        await this.repository.findOrderItemsByOrderId(orderId);

      this.logger.info({ unitId, orderId }, 'Order updated successfully');

      return {
        success: true,
        statusCode: 200,
        message: 'Order berhasil diperbarui',
        data: this.mapToDetailResponse(updatedOrder!, updatedItems),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        { err: error, unitId, orderId },
        'Unexpected error while updating order',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  // ===========================
  // Cancel Order
  // ===========================

  async cancelOrder(
    unitId: string,
    orderId: string,
  ): Promise<OrderCancelApiResponse> {
    try {
      this.logger.info({ unitId, orderId }, 'Cancelling order');

      // 1. Validate unit exists
      const unit = await this.repository.findUnitById(unitId);
      if (!unit) {
        this.logger.warn({ unitId }, 'Order cancel failed - unit not found');
        throw unitNotFoundError();
      }

      // 2. Fetch order
      const existingOrder = await this.repository.findById(unitId, orderId);
      if (!existingOrder) {
        this.logger.warn(
          { unitId, orderId },
          'Order cancel failed - order not found',
        );
        throw orderNotFoundError();
      }

      // 3. Only orders in 'baru masuk' status can be cancelled
      const currentStatusValue =
        existingOrder.order_status_code ?? existingOrder.order_status_name;

      if (!currentStatusValue) {
        throw orderStatusNotFoundError();
      }

      const currentStatusCode = resolveStatusCode(currentStatusValue);

      if (currentStatusCode === 'DIBATALKAN') {
        this.logger.warn(
          { unitId, orderId, status: existingOrder.order_status_name },
          'Order cancel failed - order already cancelled',
        );
        throw orderAlreadyCancelledError();
      }

      if (currentStatusCode !== 'BARU_MASUK') {
        this.logger.warn(
          {
            unitId,
            orderId,
            statusId: existingOrder.order_status_id,
            statusName: existingOrder.order_status_name,
            statusCode: currentStatusCode,
          },
          'Order cancel failed - order cannot be cancelled in current status',
        );
        throw orderCannotBeCancelledError();
      }

      // 4. Mark order as cancelled by status transition only
      await this.repository.transaction(async (trx) => {
        await this.repository.update(
          orderId,
          { order_status_id: this.config.order.cancelStatusUuid },
          trx,
        );
      });

      this.logger.info({ unitId, orderId }, 'Order cancelled successfully');

      return {
        success: true,
        statusCode: 200,
        message: 'Order berhasil dibatalkan',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        { err: error, unitId, orderId },
        'Unexpected error while cancelling order',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  // ===========================
  // Private Helpers
  // ===========================

  /**
   * Detect if an order type is dine-in based on its name.
   * Matches 'dine-in', 'dine in', 'dinein' (case-insensitive).
   */
  private isDineInType(orderTypeName: string): boolean {
    const normalized = orderTypeName.toLowerCase().replace(/[\s-]/g, '');
    return normalized === 'dinein';
  }

  /**
   * Validate table_number presence against the resolved order type.
   *   - dine-in without table_number  → throw 400
   *   - non-dine-in with table_number → throw 400
   */
  private validateTableNumber(
    isDineIn: boolean,
    tableNumber: string | undefined,
  ): void {
    if (isDineIn && !tableNumber) {
      throw new AppError({
        code: ErrorCodes.ValidationFailed,
        message: 'Nomor meja wajib diisi untuk tipe order dine-in',
        status: 400,
      });
    }
    if (!isDineIn && tableNumber) {
      throw new AppError({
        code: ErrorCodes.ValidationFailed,
        message: 'Nomor meja tidak diperlukan untuk tipe order selain dine-in',
        status: 400,
      });
    }
  }

  /**
   * Merge items that share the same menu_item_id.
   * Quantities are summed; the last occurrence wins for all other fields.
   */
  private mergeOrderItems<T extends { menu_item_id: string; quantity: number }>(
    items: T[],
  ): T[] {
    const map = new Map<string, T>();
    for (const item of items) {
      const existing = map.get(item.menu_item_id);
      if (existing) {
        map.set(item.menu_item_id, {
          ...item,
          quantity: existing.quantity + item.quantity,
        });
      } else {
        map.set(item.menu_item_id, { ...item });
      }
    }
    return Array.from(map.values());
  }

  /**
   * Validate that every requested item:
   *   1. exists in this unit (menu_items_units join)
   *   2. is currently available (is_available = true)
   *   3. has a price within PRICE_TOLERANCE of the DB price
   */
  private validateMenuItems(
    items: Array<{ menu_item_id: string; item_price: number }>,
    menuRows: MenuItemLookupRow[],
    unitId: string,
  ): void {
    const menuMap = new Map(menuRows.map((m) => [m.menu_item_id, m]));

    for (const item of items) {
      const menu = menuMap.get(item.menu_item_id);

      if (!menu) {
        this.logger.warn(
          { menuItemId: item.menu_item_id, unitId },
          'Menu not found in unit',
        );
        throw orderMenuNotInUnitError();
      }

      if (!menu.is_available) {
        this.logger.warn(
          { menuItemId: item.menu_item_id, menuName: menu.menu_item_name },
          'Menu not available',
        );
        throw orderMenuNotAvailableError(menu.menu_item_name);
      }

      const priceDiff = Math.abs(
        Number(item.item_price) - Number(menu.item_price),
      );
      if (priceDiff > PRICE_TOLERANCE) {
        this.logger.warn(
          {
            menuItemId: item.menu_item_id,
            menuName: menu.menu_item_name,
            clientPrice: item.item_price,
            dbPrice: menu.item_price,
            diff: priceDiff,
          },
          'Item price mismatch',
        );
        throw orderPriceMismatchError(menu.menu_item_name);
      }
    }
  }

  /**
   * Sum item_price * quantity for every item in the list.
   */
  private calculateSubtotal(
    items: Array<{ item_price: number; quantity: number }>,
  ): number {
    return items.reduce(
      (sum, item) => sum + Number(item.item_price) * Number(item.quantity),
      0,
    );
  }

  /**
   * Assert that:
   *   |calculatedSubtotal - submittedSubtotal|           <= PRICE_TOLERANCE
   *   |submittedSubtotal + submittedTaxAmount - total|   <= PRICE_TOLERANCE
   */
  private validatePricing(
    calculatedSubtotal: number,
    submittedSubtotal: number,
    submittedTaxAmount: number,
    submittedTotalAmount: number,
  ): void {
    if (Math.abs(calculatedSubtotal - submittedSubtotal) > PRICE_TOLERANCE) {
      throw new AppError({
        code: ErrorCodes.ValidationFailed,
        message: 'Subtotal tidak sesuai dengan jumlah item yang dipesan',
        status: 400,
      });
    }

    const expectedTotal = submittedSubtotal + submittedTaxAmount;
    if (Math.abs(expectedTotal - submittedTotalAmount) > PRICE_TOLERANCE) {
      throw new AppError({
        code: ErrorCodes.ValidationFailed,
        message: 'Total pembayaran tidak sesuai dengan subtotal ditambah pajak',
        status: 400,
      });
    }
  }

  private async assertCanAccessTransactionHistory(
    unitId: string,
    user: JwtTokenPayload,
  ): Promise<void> {
    if (this.canAccessAllUnits(user)) {
      return;
    }

    const hasAssignedUnit = await this.repository.userHasActiveUnit(
      user.sub,
      unitId,
    );

    if (!hasAssignedUnit) {
      this.logger.warn(
        { unitId, userId: user.sub, role: user.roles },
        'Transaction history access denied - user not assigned to unit',
      );
      throw authForbiddenError();
    }
  }

  private canAccessAllUnits(user: JwtTokenPayload): boolean {
    if (user.units.some((unit) => this.normalizeRoleCode(unit) === 'all')) {
      return true;
    }

    const normalizedRole = this.normalizeRoleCode(user.roles);

    return ALL_UNIT_ROLE_CODES.some(
      (roleCode) =>
        normalizedRole === roleCode || normalizedRole.includes(roleCode),
    );
  }

  private normalizeRoleCode(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '_');
  }

  private parseOptionalDate(
    value: string | undefined,
    fieldName: string,
    endOfDay = false,
  ): Date | undefined {
    if (!value) return undefined;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new AppError({
        code: ErrorCodes.ValidationFailed,
        message: `${fieldName} harus berupa tanggal ISO 8601 yang valid`,
        status: 400,
      });
    }

    if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      date.setUTCHours(23, 59, 59, 999);
    }

    return date;
  }

  private assertDateRange(dateFrom?: Date, dateTo?: Date): void {
    if (dateFrom && dateTo && dateFrom > dateTo) {
      throw new AppError({
        code: ErrorCodes.ValidationFailed,
        message: 'date_from tidak boleh lebih besar dari date_to',
        status: 400,
      });
    }
  }

  /**
   * Generate order number in format: ORD-XXXXXX.
   */
  private generateOrderNumber(): string {
    const bytes = randomBytes(6);
    const randomString = Array.from(bytes, (byte) =>
      ORDER_NUMBER_RANDOM_CHARS.charAt(byte % ORDER_NUMBER_RANDOM_CHARS.length),
    ).join('');

    return `ORD-${randomString}`;
  }

  // ===========================
  // Response Mappers
  // ===========================

  private mapToListItemResponse(row: OrderRow) {
    return {
      order_id: row.order_id,
      order_number: row.order_number,
      customer_name: row.customer_name,
      table_number: row.table_number,
      order_type_id: row.order_type_id,
      order_type_name: row.order_type_name,
      total_amount: Number(row.total_amount),
      order_status_id: row.order_status_id,
      order_status_name: row.order_status_name,
      ordered_at: row.ordered_at,
    };
  }

  private mapToTransactionHistoryResponse(row: OrderTransactionHistoryRow) {
    return {
      order_id: row.order_id,
      order_number: row.order_number,
      business_unit_id: row.unit_id,
      business_unit_name: row.business_unit_name,
      customer_name: row.customer_name,
      table_number: row.table_number,
      order_type_id: row.order_type_id,
      order_type_name: row.order_type_name,
      total_amount: Number(row.total_amount),
      order_status_id: row.order_status_id,
      order_status_name: row.order_status_name,
      ordered_at: row.ordered_at,
      completed_at: row.completed_at,
      payment:
        row.payment_id &&
        row.reference_number &&
        row.payment_status &&
        row.payment_amount !== null
          ? {
              payment_id: row.payment_id,
              reference_number: row.reference_number,
              payment_status: row.payment_status,
              payment_method: row.payment_method ?? 'cash',
              amount: Number(row.payment_amount),
              paid_at: row.paid_at,
            }
          : null,
    };
  }

  private mapToItemResponse(row: OrderItemRow): OrderItemResponse {
    return mapOrderItemResponse(row);
  }

  private mapToDetailResponse(
    order: OrderRow,
    items: OrderItemRow[],
  ): OrderDetailResponse {
    return mapOrderDetailResponse(order, items);
  }
}
