import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import CustomerCard from "../components/customers/CustomerCard";
import CustomerModal from "../components/customers/CustomerModal";
import CustomerDrawer from "../components/customerDrawer/CustomerDrawer";

import type {
  CreateCustomerDTO,
  Customer,
} from "../types/customer";

export default function Customers() {
  const [open, setOpen] = useState(false);

  const [modalMode, setModalMode] = useState<
    "create" | "edit"
  >("create");

  const [editingCustomer, setEditingCustomer] =
    useState<Customer | null>(null);

  const [customers, setCustomers] = useState<
    Customer[]
  >([]);

  const [search, setSearch] = useState("");

  const [drawerOpen, setDrawerOpen] =
    useState(false);

  const [drawerLoading, setDrawerLoading] =
    useState(false);

  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);

  async function loadCustomers(keyword = "") {
    try {
      if (keyword.trim() === "") {
        const data =
          await window.customer.getAll();

        setCustomers(data);
      } else {
        const data =
          await window.customer.search(keyword);

        setCustomers(data);
      }
    } catch (error) {
      console.error(error);

      toast.error(
        "Failed to load customers."
      );
    }
  }

  useEffect(() => {
    loadCustomers(search);
  }, [search]);

  async function saveCustomer(
    customer: CreateCustomerDTO
  ) {
    try {
      if (
        modalMode === "create"
      ) {
        await window.customer.create(
          customer
        );

        toast.success(
          "Customer created successfully."
        );
      } else {
        if (!editingCustomer) return;

        await window.customer.update(
          editingCustomer.id,
          customer
        );

        toast.success(
          "Customer updated successfully."
        );
      }

      await loadCustomers(search);

      if (
        drawerOpen &&
        selectedCustomer
      ) {
        const refreshed =
          await window.customer.getById(
            selectedCustomer.id
          );

        setSelectedCustomer(
          refreshed
        );
      }

      setOpen(false);

      setEditingCustomer(null);

      setModalMode("create");
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(
          "Unable to save customer."
        );
      }
    }
  }

  async function openCustomerDrawer(
    id: number
  ) {
    try {
      setDrawerOpen(true);

      setDrawerLoading(true);

      const customer =
        await window.customer.getById(id);

      setSelectedCustomer(customer);
    } catch (error) {
      console.error(error);

      toast.error(
        "Failed to load customer."
      );

      setDrawerOpen(false);
    } finally {
      setDrawerLoading(false);
    }
  }

  function closeDrawer() {
    setDrawerOpen(false);

    setSelectedCustomer(null);
  }

  function openCreateModal() {
    setModalMode("create");

    setEditingCustomer(null);

    setOpen(true);
  }

  function openEditModal() {
    if (!selectedCustomer) return;

    setModalMode("edit");

    setEditingCustomer(
      selectedCustomer
    );

    setOpen(true);
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          marginBottom: 20,
        }}
      >
        <h1>Customers</h1>

        <button
          className="newCustomerButton"
          onClick={
            openCreateModal
          }
        >
          + New Customer
        </button>
      </div>

      <input
        className="search-box"
        placeholder="Search customer..."
        value={search}
        onChange={(e) =>
          setSearch(
            e.target.value
          )
        }
      />

      <div className="customer-list">
        {customers.length ===
        0 ? (
          <p>
            No customers found.
          </p>
        ) : (
          customers.map(
            (customer) => (
              <CustomerCard
                key={
                  customer.id
                }
                customer={
                  customer
                }
                onClick={() =>
                  openCustomerDrawer(
                    customer.id
                  )
                }
              />
            )
          )
        )}
      </div>

      <CustomerModal
        open={open}
        mode={modalMode}
        customer={
          editingCustomer
        }
        onClose={() => {
          setOpen(false);
          setEditingCustomer(
            null
          );
          setModalMode(
            "create"
          );
        }}
        onSave={
          saveCustomer
        }
      />

      <CustomerDrawer
        open={drawerOpen}
        loading={
          drawerLoading
        }
        customer={
          selectedCustomer
        }
        onClose={
          closeDrawer
        }
        onEdit={
          openEditModal
        }
      />
    </>
  );
}