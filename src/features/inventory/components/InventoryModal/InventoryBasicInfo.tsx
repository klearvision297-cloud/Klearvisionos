import type { CreateInventoryDTO } from "../../../../types/inventory";

type Props = {
  form: CreateInventoryDTO;
  setForm: React.Dispatch<
    React.SetStateAction<CreateInventoryDTO>
  >;
};

export default function InventoryBasicInfo({
  form,
  setForm,
}: Props) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 18,
      }}
    >
      <div>
        <label>Item Type</label>

        <select
          value={form.itemType}
          onChange={(e) =>
            setForm({
              ...form,
              itemType: e.target.value,
            })
          }
        >
          <option>Frame</option>
          <option>Lens</option>
          <option>Contact Lens</option>
          <option>Sunglass</option>
          <option>Accessory</option>
          <option>Cleaning Solution</option>
          <option>Eye Drops</option>
          <option>Service</option>
        </select>
      </div>

      <div>
        <label>Brand</label>

        <input
          value={form.brand}
          onChange={(e) =>
            setForm({
              ...form,
              brand: e.target.value,
            })
          }
          placeholder="Titan"
        />
      </div>

      <div>
        <label>Category</label>

        <input
          value={form.category}
          onChange={(e) =>
            setForm({
              ...form,
              category: e.target.value,
            })
          }
          placeholder="Metal Frame"
        />
      </div>

      <div>
        <label>Model</label>

        <input
          value={form.model}
          onChange={(e) =>
            setForm({
              ...form,
              model: e.target.value,
            })
          }
          placeholder="TF-210"
        />
      </div>

      <div>
        <label>Color</label>

        <input
          value={form.color}
          onChange={(e) =>
            setForm({
              ...form,
              color: e.target.value,
            })
          }
          placeholder="Black"
        />
      </div>

      <div>
        <label>Size</label>

        <input
          value={form.size}
          onChange={(e) =>
            setForm({
              ...form,
              size: e.target.value,
            })
          }
          placeholder="54-18-140"
        />
      </div>

      <div
        style={{
          gridColumn: "1 / 3",
        }}
      >
        <label>Barcode</label>

        <input
          value={form.barcode}
          onChange={(e) =>
            setForm({
              ...form,
              barcode: e.target.value,
            })
          }
          placeholder="Scan or Enter Barcode"
        />
      </div>

      <div
        style={{
          gridColumn: "1 / 3",
        }}
      >
        <label>Description</label>

        <textarea
          rows={4}
          value={form.description}
          onChange={(e) =>
            setForm({
              ...form,
              description: e.target.value,
            })
          }
          placeholder="Product description..."
        />
      </div>
    </div>
  );
}
