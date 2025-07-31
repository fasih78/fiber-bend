import { userSchemas } from './modules/user/user.schema';
import userRoutes from './modules/user/user.route';
import createServer from './utils/create_server';
import authenticate from './middlewares/authenticate_middleware';
import { brandSchemas } from './modules/brand/brand.schema';
import brandRoutes from './modules/brand/brand.route';
import { citySchemas } from './modules/city/city.schema';
import cityRoutes from './modules/city/city.route';
import { stateSchemas } from './modules/state/state.schema';
import stateRoutes from './modules/state/state.route';
import { paymentTermSchemas } from './modules/payment_term/payment_term.schema';
import paymentTermRoutes from './modules/payment_term/payment_term.route';
import { currencySchemas } from './modules/currency/currency.schema';
import { countrySchemas } from './modules/country/country.schema';
import currencyRoutes from './modules/currency/currency.route';
import countryRoutes from './modules/country/country.route';
import { customerSchemas } from './modules/customer/customer.schema';
import customerRoutes from './modules/customer/customer.route';
import { productSchemas } from './modules/product/product.schema';
import productRoutes from './modules/product/product.route';
import { salesContractSchema } from './modules/sales_contract/sales_contract.schema';
import salesContractRoutes from './modules/sales_contract/sales_contract.routes';
import { productionSchema } from './modules/production/production.schema';
import productiontRoutes from './modules/production/production.routes';
import { MachineSchemas } from './modules/machine/machine.schema';
import machineRoutes from './modules/machine/machine.route';
import { invoiceSchema } from './modules/invoice/invoice.schema';
import invoiceRoutes from './modules/invoice/invoice.routes';
import jwt from '@fastify/jwt';
import { shipmentSchema } from './modules/shipment/shipment.schema';
import shipmentRoutes from './modules/shipment/shipment.routes';
import { payementSchema } from './modules/payment/payement.schema';
import paymentRoutes from './modules/payment/payment.routes';
import { royalitySchema } from './modules/royality/royality.schema';
import { royalityRoutes } from './modules/royality/royality.routes';
import { shipviaSchemas } from './modules/shipvia/shipvia.schema';
import shipviaRoutes from './modules/shipvia/shipvia.routes';
import userHistroyRoutes from './user_histroy/userhistroy.route';
import {returnSchema}from './modules/return/return.schema'
import returnRoutes from'./modules/return/return.routes'
import * as fastifySession from 'fastify-session';
import { userLog } from './user_histroy/userhistroy.service';
import { config } from './utils/config';
import { userHistroySchema } from './user_histroy/userhistroy.schema';
const fastify = require('fastify')();
const buildServer = async () => {
  const server = await createServer();

  // Middlewares
  server.decorate('authenticate', authenticate);
  // server.register(require('fastify-cookie'));
  // Hooks
  server.addHook('preHandler', (req, reply, next) => {
    req.jwt = server.jwt;
    return next();
  });
  fastify.register(require('@fastify/cors'), {
    origin: true,  // Allow requests from any origin
    methods: ['GET', 'PUT', 'POST', 'DELETE'], // Allow these HTTP methods
  });

  fastify.register(fastifySession, {
    secret: config.SECRET_KEY, // Change this to a secure secret key
    cookie: { secure: false },
    resave: true,
    saveUninitialized: false,
  })


  // Schemas
  for (const schema of [
    ...userSchemas,
    ...brandSchemas,
    ...paymentTermSchemas,
    ...currencySchemas,
    ...citySchemas,
    ...stateSchemas,
    ...countrySchemas,
    ...MachineSchemas,
    ...customerSchemas,
    ...productSchemas,
    ...salesContractSchema,
    ...productionSchema,
    ...invoiceSchema,
    ...shipmentSchema,
    ...payementSchema,
    ...royalitySchema,
    ...shipviaSchemas,
    ...userHistroySchema,
    ...returnSchema
  ]) {
    server.addSchema(schema);
  }


  server.get('/healthcheck', { schema: { hide: true } }, async function () {
    return { status: 'OK' };
  });

  server.register(jwt, {
    secret: process.env.JWT_SECRET!,
    // sign: {
    //   expiresIn: '10m',
    // },

  });

  server.register(userRoutes, { prefix: 'user' });
  server.register(productRoutes, { prefix: 'product' });
  server.register(brandRoutes, { prefix: 'brand' });
  server.register(paymentTermRoutes, { prefix: 'payment-term' });
  server.register(currencyRoutes, { prefix: 'currency' });
  server.register(cityRoutes, { prefix: 'city' });
  server.register(stateRoutes, { prefix: 'state' });
  server.register(countryRoutes, { prefix: 'country' });
  server.register(machineRoutes, { prefix: 'machine' });
  server.register(customerRoutes, { prefix: 'customer' });
  server.register(salesContractRoutes, { prefix: 'sales-contract' });
  server.register(productiontRoutes, { prefix: 'production' });
  server.register(invoiceRoutes, { prefix: 'invoice' });
  server.register(shipmentRoutes, { prefix: 'shipment' });
  server.register(paymentRoutes, { prefix: 'payment' });
  server.register(royalityRoutes, { prefix: 'royality' });
  server.register(shipviaRoutes, { prefix: 'shipvia' });
  server.register(userHistroyRoutes, { prefix: 'userHistroy' })
  server.register(returnRoutes, { prefix: 'return' })
  return server;
};

export default buildServer;
