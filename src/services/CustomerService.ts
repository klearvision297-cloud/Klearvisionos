import { CustomerRepository } from "../repositories/CustomerRepository";
import { CreateCustomerDTO } from "../types/customer";

export class CustomerService {
  private repository = new CustomerRepository();

  create(customer: CreateCustomerDTO) {
    const existing =
      this.repository.findByMobile(
        customer.mobile
      );

    if (existing) {
      throw new Error(
        "Customer with this mobile already exists."
      );
    }

    const customerCode =
      "KV" + Date.now().toString().slice(-6);

    return this.repository.create(
      customerCode,
      customer
    );
  }

  update(
    id: number,
    customer: CreateCustomerDTO
  ) {
    const existing =
      this.repository.findById(id);

    if (!existing) {
      throw new Error(
        "Customer not found."
      );
    }

    return this.repository.update(
      id,
      customer
    );
  }

  getAll() {
    return this.repository.getAll();
  }

  getById(id: number) {
    const customer =
      this.repository.findById(id);

    if (!customer) {
      throw new Error(
        "Customer not found."
      );
    }

    return customer;
  }

  search(keyword: string) {
    return this.repository.search(
      keyword
    );
  }

  delete(id: number) {
    return this.repository.delete(id);
  }
}