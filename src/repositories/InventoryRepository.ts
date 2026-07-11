import { getDatabase } from "../database/db";
import { CreateInventoryDTO, Inventory } from "../types/inventory";

export class InventoryRepository {
  private db = getDatabase();

  create(itemCode: string, item: CreateInventoryDTO) {
    const now = new Date().toISOString();

    const statement = this.db.prepare(`
      INSERT INTO inventory (
        itemCode,
        barcode,
        itemType,
        brand,
        category,
        model,
        color,
        size,
        description,
        costPrice,
        mrp,
        sellingPrice,
        gstRate,
        openingStock,
        currentStock,
        minimumStock,
        unit,
        supplierId,
        hsnCode,
        isActive,
        remarks,
        createdAt,
        updatedAt
      )
      VALUES (
        @itemCode,
        @barcode,
        @itemType,
        @brand,
        @category,
        @model,
        @color,
        @size,
        @description,
        @costPrice,
        @mrp,
        @sellingPrice,
        @gstRate,
        @openingStock,
        @currentStock,
        @minimumStock,
        @unit,
        @supplierId,
        @hsnCode,
        @isActive,
        @remarks,
        @createdAt,
        @updatedAt
      )
    `);

    return statement.run({
      itemCode,

      barcode: item.barcode ?? null,
      itemType: item.itemType,
      brand: item.brand ?? null,
      category: item.category ?? null,
      model: item.model ?? null,
      color: item.color ?? null,
      size: item.size ?? null,
      description: item.description ?? null,

      costPrice: item.costPrice,
      mrp: item.mrp,
      sellingPrice: item.sellingPrice,
      gstRate: item.gstRate,

      openingStock: item.openingStock,
      currentStock: item.openingStock,

      minimumStock: item.minimumStock,

      unit: item.unit,

      supplierId: item.supplierId ?? null,

      hsnCode: item.hsnCode ?? null,

      isActive: item.isActive ? 1 : 0,

      remarks: item.remarks ?? null,

      createdAt: now,
      updatedAt: now,
    });
  }

  findById(id: number): Inventory | undefined {
    return this.db
      .prepare("SELECT * FROM inventory WHERE id = ?")
      .get(id) as Inventory | undefined;
  }

  findByItemCode(itemCode: string) {
    return this.db
      .prepare(
        "SELECT * FROM inventory WHERE itemCode = ?"
      )
      .get(itemCode);
  }

  findByBarcode(barcode: string) {
    return this.db
      .prepare(
        "SELECT * FROM inventory WHERE barcode = ?"
      )
      .get(barcode);
  }

  getAll() {
    return this.db
      .prepare(`
        SELECT *
        FROM inventory
        ORDER BY id DESC
      `)
      .all();
  }

  search(keyword: string) {
    return this.db
      .prepare(`
        SELECT *
        FROM inventory
        WHERE
          itemCode LIKE ?
          OR barcode LIKE ?
          OR brand LIKE ?
          OR model LIKE ?
          OR category LIKE ?
        ORDER BY id DESC
      `)
      .all(
        `%${keyword}%`,
        `%${keyword}%`,
        `%${keyword}%`,
        `%${keyword}%`,
        `%${keyword}%`
      );
  }

  updateStock(
    id: number,
    currentStock: number,
    reason = "Manual Adjustment",
    remarks: string | null = null
  ) {
    const transaction =
      this.db.transaction(() => {
        const item = this.findById(id) as any;

        if (!item) {
          throw new Error(
            "Inventory item not found."
          );
        }

        const previousStock =
          item.currentStock;

        this.db
          .prepare(`
            UPDATE inventory
            SET
              currentStock = ?,
              updatedAt = ?
            WHERE id = ?
          `)
          .run(
            currentStock,
            new Date().toISOString(),
            id
          );

        this.db
          .prepare(`
            INSERT INTO stock_history (
              inventoryId,
              changeType,
              previousStock,
              newStock,
              difference,
              reason,
              remarks,
              createdAt
            )
            VALUES (
              ?,?,?,?,?,?,?,?
            )
          `)
          .run(
            id,
            "ADJUSTMENT",
            previousStock,
            currentStock,
            currentStock -
              previousStock,
            reason,
            remarks,
            new Date().toISOString()
          );
      });

    return transaction();
  }

  update(
    id: number,
    item: CreateInventoryDTO
  ) {
    return this.db
      .prepare(`
        UPDATE inventory
        SET
          barcode=@barcode,
          itemType=@itemType,
          brand=@brand,
          category=@category,
          model=@model,
          color=@color,
          size=@size,
          description=@description,
          costPrice=@costPrice,
          mrp=@mrp,
          sellingPrice=@sellingPrice,
          gstRate=@gstRate,
          openingStock=@openingStock,
          minimumStock=@minimumStock,
          unit=@unit,
          supplierId=@supplierId,
          hsnCode=@hsnCode,
          isActive=@isActive,
          remarks=@remarks,
          updatedAt=@updatedAt
        WHERE id=@id
      `)
      .run({
        id,

        barcode: item.barcode ?? null,
        itemType: item.itemType,
        brand: item.brand ?? null,
        category: item.category ?? null,
        model: item.model ?? null,
        color: item.color ?? null,
        size: item.size ?? null,
        description: item.description ?? null,

        costPrice: item.costPrice,
        mrp: item.mrp,
        sellingPrice: item.sellingPrice,
        gstRate: item.gstRate,

        openingStock: item.openingStock,

        minimumStock: item.minimumStock,

        unit: item.unit,

        supplierId: item.supplierId ?? null,

        hsnCode: item.hsnCode ?? null,

        isActive: item.isActive ? 1 : 0,

        remarks: item.remarks ?? null,

        updatedAt: new Date().toISOString(),
      });
  }

  getStockHistory() {
    return this.db
      .prepare(`
        SELECT
          sh.*,
          i.itemCode,
          i.brand,
          i.model
        FROM stock_history sh
        JOIN inventory i
          ON i.id = sh.inventoryId
        ORDER BY sh.createdAt DESC
      `)
      .all();
  }

  delete(id: number) {
    return this.db
      .prepare(
        "DELETE FROM inventory WHERE id = ?"
      )
      .run(id);
  }
}
