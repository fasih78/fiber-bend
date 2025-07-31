import { getModelForClass, prop, Ref } from '@typegoose/typegoose';
import { ShipmentModel } from './shipment.model';
import { ProductModel } from '../product/product.model';
import { CurrencyModel } from '../currency/currency.model';
import { CustomerModel } from '../customer/customer.model';
import { SalesContractModel } from '../sales_contract/sales_contract.model';
import { BrandModel } from '../brand/brand.model';
import { ProductionModel } from '../production/production.model';
import { ProductDtlModel } from '../product/product_dtl.model';
import { SalesContractDtlModel } from '../sales_contract/sales_contract_dtl.model';
import { ProductionDtlModel } from '../production/production_dtl.model';
import { ShipmentDtlModel } from './shipment_dtls.model';


export class ShipmentLot {

    @prop({
        type: Number,
        default: 1,

    })
    id: number;

    @prop({
        type: String,
    })
    contract: string;
    @prop({
        type: String,
    })
    lot: string;
    @prop({
        type: String,
    })
    bales: string;
    @prop({
        type: Number,
    })
    qty: number;
    @prop({
        type: Number,
    })
    selectTableQty: number;

    @prop({
        type: Number,
    })
    balance: number;
    @prop({
        type: String
    })
    supplierCode: string

    @prop({
        type: Date,
    })
    date: Date;

    @prop({
        type: Date,
    })
    gpDate: Date;

    @prop({
        type: Boolean,
        default: false,
    })
    isDeleted: boolean;

    @prop({ ref: () => ProductModel })
    product: Ref<typeof ProductModel>;

    // @prop({ ref: () => ProductDtlModel })
    // productdtl: Ref<typeof ProductDtlModel>;

    @prop({ ref: () => ProductionModel })
    production: Ref<typeof ProductionModel>;

    // @prop({ ref: () => ProductionDtlModel })
    // productiondtls: Ref<typeof ProductionDtlModel>;

    @prop({ ref: () => CustomerModel })
    customer: Ref<typeof CustomerModel>;

    @prop({ ref: () => SalesContractModel })
    salesContract: Ref<typeof SalesContractModel>;

    @prop({ ref: () => ShipmentModel })
    shipment: Ref<typeof ShipmentModel>;

    // @prop({ ref: () => SalesContractDtlModel })
    // salescontractdtls: Ref<typeof SalesContractDtlModel>;

//   @prop({ ref: () => ShipmentDtlModel })
//     shipmentdtls: Ref<typeof ShipmentDtlModel>;
}
export const ShipmentLotModel = getModelForClass(ShipmentLot, {
  schemaOptions: {
    timestamps: true,
  },
});