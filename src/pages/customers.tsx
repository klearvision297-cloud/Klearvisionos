import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import CustomerCard from "../features/customers/components/customers/CustomerCard";
import CustomerModal from "../features/customers/components/customers/CustomerModal";
import CustomerDrawer from "../features/customers/components/customerDrawer/CustomerDrawer";
import { Button, EmptyState, PageHeader, SearchBar } from "../components/ui";

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
      <PageHeader
        title="Customers"
        subtitle="Manage customer profiles and purchase history."
        action={<Button onClick={openCreateModal}>+ New Customer</Button>}
      />

      <SearchBar
        placeholder="Search customer..."
        value={search}
        onChange={(e) =>
          setSearch(
            e.target.value
          )
        }
        onClear={() => setSearch("")}
      />

      <div className="customer-list kv-page-list">
        {customers.length ===
        0 ? (
          <EmptyState
            title={search ? "No matching customers" : "No customers yet"}
            description={search ? "Try a different name, mobile number, or customer code." : "Create your first customer profile to begin."}
            action={!search ? <Button onClick={openCreateModal}>+ New Customer</Button> : undefined}
          />
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
