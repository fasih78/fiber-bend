import { getModelForClass, prop, Ref } from '@typegoose/typegoose';
import { SalesContractModel } from '../sales_contract/sales_contract.model';
import { CustomerModel } from '../customer/customer.model';
import { ProductModel } from '../product/product.model';
import { ShipmentModel } from '../shipment/shipment.model';
import { BrandModel } from '../brand/brand.model';


export class Return{

    @prop({
        type: Number,
        default: 1,
      })
      id: number;

      @prop({
        type: Number,
        default: 1,
      })
      retNo: number;
      @prop({
        type: String,
       
      })
      contract: string;
      @prop({
        type: Number,
       
      })
      shipmentTran: number;
    @prop({
        type: Date,
        
      })
      returnDate: Date;
      @prop({
        type: Date,
        
      })
      shipmentDate: Date;

    @prop({
    type: Number,
    })
    shipQty: number;

    @prop({
        type: Number,
        })
        shipRate: number;
    // @prop({
    //     type: Number,
    //     })
    //     shipAmount: number;


    @prop({
        type: Number,
      })
      returnQty: number;

      // @prop({
      //   type: Number,
      // })
      // returnAmount: number;

      @prop({
        type: Number,
      })
      actualQty: number;
      @prop({
        type: Number,
      })
      actualAmount: number;
      @prop({
        type: Number,
      })
      balance: number;
      @prop({
        type: Boolean,
        default: false,
      })
      isDeleted: boolean;

      @prop({
        type: Boolean,
        default: false,
      })
      return_adm: boolean;

      @prop({ ref: () => CustomerModel })
      customer: Ref<typeof CustomerModel>;
    
      @prop({ ref: () => SalesContractModel })
      salesContract: Ref<typeof SalesContractModel>;

      @prop({ ref: () => ProductModel })
      product: Ref<typeof ProductModel>;

      @prop({ ref: () => BrandModel })
        brand: Ref<typeof BrandModel>;


      @prop({ ref: () => ShipmentModel })
      shipment: Ref<typeof ShipmentModel>;



}
export const ReturnModel = getModelForClass(Return, {
  schemaOptions: {
    timestamps: true,
  },
});