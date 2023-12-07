import { z } from 'zod';
import { buildJsonSchemas } from 'fastify-zod';
import refineZod from '../../utils/refine_zod';

const customerCore = {
  id: z.number({
    required_error: 'Id is required',
  }),
  name: z.string({
    required_error: 'Name is required',
  }),
  title: z.string({
    required_error: 'Title is required',
  }),
  contact: z.string({
    required_error: 'Contact is required',
  }),
  phone: z.string({
    required_error: 'Phone is required',
  }),
  email: z.string({
    required_error: 'Email is required',
  }),
  address1: z.string({
    required_error: 'Address 1 is required',
  }),
  address2: z.string({
    required_error: 'Address 2 is required',
  }),
  zipCode: z.string({
    required_error: 'Zip Code is required',
  }),
  city: z.string({
    required_error: 'City is required',
  }),
  state: z.string({
    required_error: 'State is required',
  }),
  country: z.string({
    required_error: 'Country is required',
  }),
  salesTaxReg: z.string({
    required_error: 'Sales Tax Required is required',
  }),
  ntn: z.string({
    required_error: 'NTN is required',
  }),
};

const createCustomerSchema = z.object(customerCore);

const newCustomerId = z.object({
  id: z.number({}),
});
const customerpageSchema = z.object({
  pageno: z.number(),
  perPage: z.number(),
});


const getCustomersSchema = z
  .array(z.object({ _id: z.string(), ...customerCore }))
  .refine((elements) =>
    refineZod(elements, [
      '_id',
      'id',
      'name',
      'title',
      'contact',
      'phone',
      'email',
      'address1',
      'address2',
      'zipCode',
      'city',
      'state',
      'country',
      'salesTaxReg',
      'ntn',
    ])
  );
  const customerdrop_downSchema = z.object({
    limit:z.number().optional(),
  name:z.string().optional(),
  record:z.boolean().optional()
    
    })

export type CreateCustomerSchema = z.infer<typeof createCustomerSchema>;
export type CustomerPaginationSchema = z.infer<typeof customerpageSchema>;
export type Customerdrop_downSchema = z.infer<typeof customerdrop_downSchema>;

export const { schemas: customerSchemas, $ref } = buildJsonSchemas(
  {
    createCustomerSchema,
    getCustomersSchema,
    newCustomerId,
    customerpageSchema,
    customerdrop_downSchema
    
  },
  { $id: 'customerSchemas' }
);
