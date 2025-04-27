import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Supplier } from './entities/supplier.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly suppliersRepository: Repository<Supplier>,
  ) {}

  /**
   * Create a new supplier in the database
   * @param createSupplierDto data for creating a new supplier
   * @returns created supplier
   */
  async create(createSupplierDto: CreateSupplierDto) {
    const existingSupplier = await this.suppliersRepository.findOne({
      where: { email: createSupplierDto.email },
    });
    if (existingSupplier)
      throw new BadRequestException('Supplier already exist!');

    const supplier = this.suppliersRepository.create(createSupplierDto);

    return await this.suppliersRepository.save(supplier);
  }

  /**
   * Finds all suppliers in database
   * @returns list of suppliers
   */
  async findAll() {
    const suppliers = await this.suppliersRepository.find({
      order: { createAt: 'DESC' },
    });
    return suppliers;
  }

  /**
   * Find a supplier by Id in the database
   * @param id  supplier Id
   * @returns supplier with the specified Id
   */
  async findOne(id: number) {
    const supplier = await this.suppliersRepository.findOne({ where: { id } });
    if (!supplier)
      throw new NotFoundException(`Supplier with Id ${id} not found`);
    return supplier;
  }

  /**
   * Updates a supplier by Id in the database.
   * @param id supplier Id
   * @param updateSupplierDto  data for updating the supplier
   * @returns updated supplier
   */
  async update(id: number, updateSupplierDto: UpdateSupplierDto) {
    const supplier = await this.findOne(id);

    Object.assign(supplier, updateSupplierDto);
    return await this.suppliersRepository.save(supplier);
  }

  /**
   * Remove a supplier by Id from the database
   * @param id supplier Id
   * @returns confirmation message
   */
  async remove(id: number) {
    const supplier = await this.findOne(id);
    await this.suppliersRepository.remove(supplier);
    return { message: 'Supplier deleted successfully!' };
  }
}
