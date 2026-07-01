import { PrismaClient, Product, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export const productRepository = {
  /**
   * Create a new product
   */
  create: async (data: Prisma.ProductCreateInput): Promise<Product> => {
    return prisma.product.create({ data });
  },

  /**
   * Find a product by ID
   */
  findById: async (id: string): Promise<Product | null> => {
    return prisma.product.findUnique({ where: { id } });
  },

  /**
   * Find a product by AliExpress ID
   */
  findByAliExpressId: async (aliexpressId: string): Promise<Product | null> => {
    return prisma.product.findUnique({ where: { aliexpressId } });
  },

  /**
   * Find many products with pagination
   */
  findMany: async (params: {
    skip?: number;
    take?: number;
    where?: Prisma.ProductWhereInput;
    orderBy?: Prisma.ProductOrderByWithRelationInput;
  }): Promise<Product[]> => {
    return prisma.product.findMany(params);
  },

  /**
   * Count products
   */
  count: async (where?: Prisma.ProductWhereInput): Promise<number> => {
    return prisma.product.count({ where });
  },

  /**
   * Update a product
   */
  update: async (
    id: string,
    data: Prisma.ProductUpdateInput
  ): Promise<Product> => {
    return prisma.product.update({
      where: { id },
      data,
    });
  },

  /**
   * Delete a product
   */
  delete: async (id: string): Promise<Product> => {
    return prisma.product.delete({ where: { id } });
  },

  /**
   * Find product with relations
   */
  findWithRelations: async (
    id: string,
    include?: Prisma.ProductInclude
  ): Promise<Product | null> => {
    return prisma.product.findUnique({
      where: { id },
      include,
    });
  },
};