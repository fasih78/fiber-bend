import moment from 'moment';
import { ReturnModel } from './return.model';
import {
  createReturnSchema,
  ReturnContractPaginationSchema,
  ReturndropdownSchema,
  ReturnReportPrintSchema,
  ReturnReportSchema,
} from './return.schema';
import mongoose from 'mongoose';
import { ShipmentModel } from '../shipment/shipment.model';
import { ShipmentDtlModel } from '../shipment/shipment_dtls.model';
import { cloneDeep, update } from 'lodash';
import { P } from 'pino';
import {
  SalesContract,
  SalesContractModel,
} from '../sales_contract/sales_contract.model';
import {
  SalesContractDtl,
  SalesContractDtlModel,
} from '../sales_contract/sales_contract_dtl.model';
import { CLIENT_RENEG_LIMIT } from 'tls';
import { error } from 'console';
import { RoyalityModel } from '../royality/royality.model';

export const createReturnContract = async (input: createReturnSchema) => {
  const {
    retNo,
    contract,
    shipmentTran,
    returnDate,
    returndtl,
    salesContract,
    customer,
    brand,
    shipment,
    shipmentDate,
    specialInstruction,
  } = input;

  if (!returndtl || returndtl.length === 0) {
    throw new Error('returndtl is undefined or empty');
  }

  console.log(shipmentDate, 'shipmentDate');

  if (customer == '648d7c960cee8c1de3294415') {
    try {
      const formattedDate = moment(returnDate).format('YYYY-MM-DD');
      const shipmentdate = moment(shipmentDate).format('YYYY-MM-DD');
      const LastUser = await ReturnModel.findOne().sort({ _id: -1 });

      const id = LastUser ? LastUser.id + 1 : 1;
      const return_record = await ReturnModel.find({
        shipment: shipment,
        isDeleted: false,
      });

      const updatedRecord = returndtl[0];
      const updatedQty = updatedRecord.actualQty;
      const actualQty = return_record.reduce((sum, item) => {
        if (item._id.toString() !== id) {
          return sum + item.actualQty;
        }
        return sum;
      }, 0);

      const allactualQty = actualQty + updatedQty;

      if (allactualQty <= returndtl[0].shipQty) {
        for (const ret of returndtl) {
          let returnDetails = await ReturnModel.create({
            id,
            retNo,
            contract,
            shipmentTran,
            returnDate: formattedDate,
            shipmentDate: shipmentdate,
            shipQty: ret.shipQty,
            shipRate: ret.shipRate,
            returnQty: ret.returnQty,
            actualQty: ret.actualQty,
            actualAmount: Number(ret.actualQty) * Number(ret.shipRate),
            balance:
              Number(ret.shipQty) -
              (Number(ret.returnQty) + Number(ret.actualQty)),
            customer: new mongoose.Types.ObjectId(customer),
            brand: new mongoose.Types.ObjectId(brand),
            product: new mongoose.Types.ObjectId(ret.product),
            salesContract: new mongoose.Types.ObjectId(salesContract),
            shipment: new mongoose.Types.ObjectId(shipment),
            specialInstruction,
            return_adm: true,
          });
        }
        const returns = await ReturnModel.find({
          salesContract: salesContract,
          isDeleted: false,
        });

        let returnDtlsQty = 0;
        let shipmentDtlsQty = 0;

        for (let d of returns) {
          let actualQty = isNaN(Number(d.actualQty)) ? 0 : Number(d.actualQty);
          // let returnQty = isNaN(Number(d.returnQty)) ? 0 : Number(d.returnQty);

          returnDtlsQty += actualQty;
        }

        const allShipments = await ShipmentDtlModel.find({
          shipment: shipment,
        });

        for (let d of allShipments) {
          shipmentDtlsQty += Number(d.qty) || 0;
        }

        if (returnDtlsQty >= shipmentDtlsQty) {
          console.log(
            `Return Quantity (${returnDtlsQty}) is greater or equal to Shipment Quantity (${shipmentDtlsQty})`
          );

          await ShipmentModel.updateOne({ _id: shipment }, { return: true });
          await RoyalityModel.updateOne({salesContract: salesContract}, { return: true });
          await ShipmentDtlModel.updateOne(
            { shipment: shipment },
            { return: true }
          );
        }
      } else {
        return 'Actual Quantity is greater than  shipmentQty!';
      }
      return 'Return contract created successfully';
    } catch (error) {
      console.error('Error creating return contract:', error);
      throw error;
    }
  } else {
    try {
      const formattedDate = moment(returnDate).format('YYYY-MM-DD');
      const shipmentdate = moment(shipmentDate).format('YYYY-MM-DD');
      const LastUser = await ReturnModel.findOne().sort({ _id: -1 });
      const id = LastUser ? LastUser.id + 1 : 1;

      const return_record = await ReturnModel.find({
        shipment: shipment,
        isDeleted: false,
      });

      const updatedRecord = returndtl[0];
      const updatedQty = updatedRecord.actualQty;
      const actualQty = return_record.reduce((sum, item) => {
        if (item._id.toString() !== id) {
          return sum + item.actualQty;
        }
        return sum;
      }, 0);

      console.log(actualQty, updatedQty);
      const allactualQty = actualQty + updatedQty;

      console.log(allactualQty, 'actual');
      console.log(returndtl[0].shipQty, 'return');
      if (allactualQty <= returndtl[0].shipQty) {
        for (const ret of returndtl) {
          let returnDetails = await ReturnModel.create({
            id,
            retNo,
            contract,
            shipmentTran,
            returnDate: formattedDate,
            shipmentDate: shipmentdate,
            shipQty: ret.shipQty,
            shipRate: ret.shipRate,
            returnQty: ret.returnQty,
            actualQty: ret.actualQty,
            actualAmount: Number(ret.actualQty) * Number(ret.shipRate),
            balance:
              Number(ret.shipQty) -
              (Number(ret.returnQty) + Number(ret.actualQty)),
            customer: new mongoose.Types.ObjectId(customer),
            brand: new mongoose.Types.ObjectId(brand),
            product: new mongoose.Types.ObjectId(ret.product),
            salesContract: new mongoose.Types.ObjectId(salesContract),
            shipment: new mongoose.Types.ObjectId(shipment),
            specialInstruction,
          });
        }
        const returns = await ReturnModel.find({
          salesContract: salesContract,
          isDeleted: false,
        });

        let returnDtlsQty = 0;
        let shipmentDtlsQty = 0;

        for (let d of returns) {
          let actualQty = isNaN(Number(d.actualQty)) ? 0 : Number(d.actualQty);
          // let returnQty = isNaN(Number(d.returnQty)) ? 0 : Number(d.returnQty);

          returnDtlsQty += actualQty;
        }

        const allShipments = await ShipmentDtlModel.find({
          shipment: shipment,
        });

        for (let d of allShipments) {
          shipmentDtlsQty += Number(d.qty) || 0;
        }

        if (returnDtlsQty >= shipmentDtlsQty) {
          console.log(
            `Return Quantity (${returnDtlsQty}) is greater or equal to Shipment Quantity (${shipmentDtlsQty})`
          );

          await ShipmentModel.updateOne({ _id: shipment }, { return: true });
          await RoyalityModel.updateOne({salesContract: salesContract}, { return: true });
          await ShipmentDtlModel.updateOne(
            { shipment: shipment },
            { return: true }
          );
        }
      } else {
        return 'Actual Quantity is greater than  shipmentQty!';
      }

      return 'Return contract created successfully';
    } catch (error) {
      console.error('Error creating return contract:', error);
      throw error;
    }
  }
};
export const getNewReturnId = async () => {
  const Return = await ReturnModel.findOne()
    .sort({ field: 'asc', _id: -1 })
    .limit(1);

  let newId: number = 1;
  if (Return != null) {
    newId = Return.id + 1;
  }

  return newId;
};

export const Returndropdown = async (input: ReturndropdownSchema) => {
  const limit = input?.limit || 10;
  const tran: string = input?.tran ?? '';

  if (input.record === true) {
    const shipment = await ShipmentDtlModel.aggregate([
      {
        $match: {
          isDeleted: false,
          return: false,
        },
      },
      {
        $lookup: {
          from: 'shipments',
          localField: 'shipment',
          foreignField: '_id',
          as: 'shipments',
        },
      },
      {
        $lookup: {
          from: 'invoicedtls',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'invoicedtls',
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product',
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
        },
      },
      {
        $lookup: {
          from: 'salescontractdtls',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'salescontractDetails',
          pipeline: [
            {
              $lookup: {
                from: 'salescontracts',
                localField: 'salesContract',
                foreignField: '_id',
                as: 'salescontract',
              },
            },
          ],
        },
      },
      {
        $project: {
          tran: '$shipment_no',
          uom: '$invoicedtls.uom',
          shipQty: '$qty',
          shipAmount: '$amount',
          shipRate: '$rate',
          shipmentObjectId: '$shipments._id',
          productObjectId: '$product._id',
          productName: '$product.name',
          customerObjectId: '$customer._id',
          customerName: '$customer.name',
          brandObjectId: '$brand._id',
          brandName: '$brand.name',
          contract: '$salescontractDetails.salescontract.contract',
          salescontractObjectId: '$salescontractDetails.salescontract._id',
          shipmentDate: '$gpDate',
          shipmentTran: '$shipment_no',
        },
      },
    ]).exec();
    return shipment;
  } else if (tran !== '') {
    let contract: string | null = null;

    // Check if input.tran matches a sales contract
    const sale = await SalesContractModel.find({
      contract: { $regex: `^${tran}`, $options: 'i' },
      isDeleted: false,
    });

    contract = sale.length > 0 ? sale[0]._id : null;

    const shipmentFilter: Record<string, any> = {
      return: false,
      isDeleted: false,
    };

    if (contract) {
      console.log(`Filtering by contract: ${contract}`);
      shipmentFilter.salesContract = contract;
    } else {
      console.log(`Filtering by shipment number (Regex applied): ${tran}`);
      shipmentFilter.shipment_no = Number(tran);
    }

    const shipment = await ShipmentDtlModel.aggregate([
      {
        $match: shipmentFilter,
      },
      {
        $lookup: {
          from: 'shipments',
          localField: 'shipment',
          foreignField: '_id',
          as: 'shipments',
        },
      },
      {
        $lookup: {
          from: 'invoicedtls',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'invoicedtls',
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product',
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
        },
      },
      {
        $lookup: {
          from: 'salescontractdtls',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'salescontractDetails',
          pipeline: [
            {
              $lookup: {
                from: 'salescontracts',
                localField: 'salesContract',
                foreignField: '_id',
                as: 'salescontract',
              },
            },
          ],
        },
      },
      {
        $project: {
          tran: '$shipment_no',
          uom: '$invoicedtls.uom',
          shipQty: '$qty',
          shipAmount: '$amount',
          shipRate: '$rate',
          shipmentObjectId: '$shipments._id',
          productObjectId: '$product._id',
          productName: '$product.name',
          customerObjectId: '$customer._id',
          customerName: '$customer.name',
          brandObjectId: '$brand._id',
          brandName: '$brand.name',
          contract: '$salescontractDetails.salescontract.contract',
          salescontractObjectId: '$salescontractDetails.salescontract._id',
          shipmentDate: '$gpDate',
          shipmentTran: '$shipment_no',
        },
      },
      { $limit: limit },
    ]).exec();

    return shipment;
  } else {
    const shipment = await ShipmentDtlModel.aggregate([
      {
        $match: {
          isDeleted: false,
          return: false,
        },
      },
      {
        $lookup: {
          from: 'shipments',
          localField: 'shipment',
          foreignField: '_id',
          as: 'shipments',
        },
      },
      {
        $lookup: {
          from: 'invoicedtls',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'invoicedtls',
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product',
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
        },
      },
      {
        $lookup: {
          from: 'salescontractdtls',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'salescontractDetails',
          pipeline: [
            {
              $lookup: {
                from: 'salescontracts',
                localField: 'salesContract',
                foreignField: '_id',
                as: 'salescontract',
              },
            },
          ],
        },
      },
      {
        $project: {
          tran: '$shipment_no',
          uom: '$invoicedtls.uom',
          shipQty: '$qty',
          shipAmount: '$amount',
          shipRate: '$rate',
          shipmentObjectId: '$shipments._id',
          productObjectId: '$product._id',
          productName: '$product.name',
          customerObjectId: '$customer._id',
          customerName: '$customer.name',
          brandObjectId: '$brand._id',
          brandName: '$brand.name',
          contract: '$salescontractDetails.salescontract.contract',
          salescontractObjectId: '$salescontractDetails.salescontract._id',
          shipmentDate: '$gpDate',
          shipmentTran: '$shipment_no',
        },
      },
      { $limit: limit },
    ]).exec();

    return shipment;
  }
};

export const findReturnContractWithMoreQty = async (id: string) => {
  const returns = await ShipmentDtlModel.find({
    shipment: new mongoose.Types.ObjectId(id),
    isDeleted: false,
  });

  const returnDtls: any[] = [];

  for (let ret of returns) {
    const dtl = await ReturnModel.find({ shipment: ret.shipment });

    if (dtl) {
      for (let d of dtl) {
        returnDtls.push(d);
      }
    }
  }

  let shipdtl = await ShipmentDtlModel.aggregate([
    {
      $match: {
        shipment: new mongoose.Types.ObjectId(id),
      },
    },

    {
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'productData',
        pipeline: [
          {
            $lookup: {
              from: 'productdtls',
              localField: '_id',
              foreignField: 'product',
              as: 'productdtlData',
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: 'currencies',
        localField: 'currency',
        foreignField: '_id',
        as: 'currencyData',
      },
    },
  ]);

  if (shipdtl && returnDtls.length > 0) {
    let returnQty = 0;
    shipdtl.forEach((sale, index) => {
      returnDtls.forEach((ship) => {
        if (ship.product.toString() == sale.product._id.toString()) {
          returnQty += ship.actualQty;
          // const returnQty = Math.max(0, ship.returnQty + ship.actualQty)
          const actualQty = 0;
          shipdtl[index].returnQty = returnQty;
          shipdtl[index].actualQty = actualQty;
          Math.max(0, shipdtl[index].qty);
        }
      });
    });
  }

  const res = shipdtl.filter((s) => s.qty > 0);

  return res;
};

export const findReturnContractWithPagination = async (
  input: ReturnContractPaginationSchema
) => {
  if (input.contract !== '') {
    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;

    const searchQuery = new RegExp(`^${input?.contract}`, 'i');

    const returnrecord = await ReturnModel.find({
      contract: { $regex: searchQuery },
      isDeleted: false,
    });

    const returnDetail = await ReturnModel.aggregate([
      {
        $match: {
          contract: { $regex: searchQuery },
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContract',
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product',
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
        },
      },
      {
        $lookup: {
          from: 'shipments',
          localField: 'shipment',
          foreignField: '_id',
          as: 'shipment',
        },
      },
      { $skip: skipCount },
      { $limit: limit },
      { $sort: { retNo: 1 } },
    ]);
    let result = {
      returnDetails: returnDetail,
      returnDetailRecord: returnrecord.length,
    };
    return result;
  } else {
    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;

    const returnrecord = await ReturnModel.find({
      isDeleted: false,
    });

    const returnDetail = await ReturnModel.aggregate([
      {
        $match: {
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $lookup: {
          from: 'salescontracts',
          localField: 'salesContract',
          foreignField: '_id',
          as: 'salesContract',
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brand',
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product',
        },
      },
      {
        $lookup: {
          from: 'shipments',
          localField: 'shipment',
          foreignField: '_id',
          as: 'shipment',
        },
      },
      { $skip: skipCount },
      { $limit: limit },
      { $sort: { retNo: 1 } },
    ]);
    let result = {
      returnDetails: returnDetail,
      returnDetailRecord: returnrecord.length,
    };
    return result;
  }
};

export const deleteReturnContractById = async (id: string) => {
  const returnContract = await ReturnModel.findOne({ _id: id });

  if (!returnContract) {
    return 'Return contract not found';
  }

  const deleteResult = await ReturnModel.updateOne(
    { _id: id },
    {
      $set: { isDeleted: true },
    }
  );

  await ShipmentModel.updateOne(
    { _id: returnContract.shipment },
    { $set: { return: false } }
  );

  await ShipmentDtlModel.updateOne(
    { shipment: returnContract.shipment },
    { $set: { return: false } }
  );

  return 'Deleted successfully';
};

export const returnContractUpdateById = async (
  id: string,
  input: createReturnSchema
) => {
  const {
    retNo,
    contract,
    shipmentTran,
    returnDate,
    returndtl,
    salesContract,
    customer,
    brand,
    shipment,
    shipmentDate,
    specialInstruction,
  } = input;

  const formattedDate = moment(returnDate).format('YYYY-MM-DD');
  const shipmentdate = moment(shipmentDate).format('YYYY-MM-DD');

  if (!returndtl || returndtl.length === 0) {
    throw new Error('returndtl is undefined or empty');
  }

  const return_record = await ReturnModel.find({
    shipment: shipment,
    isDeleted: false,
  });

  const updatedRecord = returndtl[0];
  const updatedQty = updatedRecord.actualQty;

  const actualQty = return_record.reduce((sum, item) => {
    if (item._id.toString() !== id) {
      return sum + item.actualQty;
    }
    return sum;
  }, 0);

  const allactualQty = actualQty + updatedQty;

  if (allactualQty > return_record[0].shipQty) {
    throw new Error('ActualQty is greater than shipQty!');
  }

  const updatedReturn = await ReturnModel.findByIdAndUpdate(
    id,
    {
      retNo,
      contract,
      shipmentTran,
      returnDate: formattedDate,
      shipmentDate: shipmentdate,
      shipQty: updatedRecord.shipQty,
      shipRate: updatedRecord.shipRate,
      returnQty: updatedRecord.returnQty,
      actualQty: updatedRecord.actualQty,
      actualAmount:
        Number(updatedRecord.actualQty) * Number(updatedRecord.shipRate),
      balance:
        Number(updatedRecord.shipQty) -
        (Number(updatedRecord.returnQty) + Number(updatedRecord.actualQty)),
      customer: new mongoose.Types.ObjectId(customer),
      brand: new mongoose.Types.ObjectId(brand),
      product: new mongoose.Types.ObjectId(updatedRecord.product),
      salesContract: new mongoose.Types.ObjectId(salesContract),
      shipment: new mongoose.Types.ObjectId(shipment),
      specialInstruction,
      return_adm: customer === '648d7c960cee8c1de3294415',
    },
    { new: true }
  );
  const shipmentqty = await ReturnModel.find({
    shipment: shipment,
    isDeleted: false,
  });

  const shipmentTotalQtyAfterUpdate = shipmentqty.reduce((sum, item) => {
    return sum + item.actualQty;
  }, 0);
  console.log(shipmentTotalQtyAfterUpdate);
  if (shipmentTotalQtyAfterUpdate < return_record[0].shipQty) {
    await ShipmentDtlModel.updateOne(
      { isDeleted: false, shipment: shipment },
      { $set: { return: false } }
    );

    await ShipmentModel.updateOne(
      { isDeleted: false, _id: shipment },
      { $set: { return: false } }
    );
  } else if (shipmentTotalQtyAfterUpdate === return_record[0].shipQty) {
    await ShipmentDtlModel.updateOne(
      { isDeleted: false, shipment: shipment },
      { $set: { return: true } }
    );

    await ShipmentModel.updateOne(
      { isDeleted: false, _id: shipment },
      { $set: { return: true } }
    );
    return { success: true };
  } else {
    return 'Return Total Qty Is Greater Than Shipmentdtl Total Qty';
  }

  return updatedReturn;
};

export const findReturnDtls = async (id: string) => {
  const returndtl = await ReturnModel.aggregate([
    {
      $match: {
        isDeleted: false,
        _id: new mongoose.Types.ObjectId(id),
      },
    },
    {
      $lookup: {
        from: 'customers',
        localField: 'customer',
        foreignField: '_id',
        as: 'customer',
      },
    },
    {
      $lookup: {
        from: 'salescontracts',
        localField: 'salesContract',
        foreignField: '_id',
        as: 'salesContract',
      },
    },
    {
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'product',
      },
    },
    {
      $lookup: {
        from: 'brands',
        localField: 'brand',
        foreignField: '_id',
        as: 'brand',
      },
    },
    {
      $lookup: {
        from: 'shipments',
        localField: 'shipment',
        foreignField: '_id',
        as: 'shipment',
      },
    },
  ]);
  return returndtl;
};

export const findReturnDtlsByDate = async (input: ReturnReportSchema) => {
  try {
    const {
      brand,
      customer,
      product,
      salesContract,
      fromDate,
      toDate,
      pageno = 1,
      perPage = 10,
      royality_approval,
      Adm,
      nonAdm,
      brandgroup,
      customergroup,
      productgroup,
    } = input;

    const limit = perPage;
    const skipCount = (pageno - 1) * limit;

    const groupId: any = {};
    const shouldGroup = productgroup || brandgroup || customergroup;

    if (productgroup) groupId.product = '$product';
    if (brandgroup) groupId.brand = '$brand';
    if (customergroup) groupId.customer = '$customer';

    const matchStage: any = { isDeleted: false };

    if (fromDate && toDate) {
      matchStage.returnDate = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    }

    if (product?.length > 0) {
      matchStage.product = new mongoose.Types.ObjectId(product[0]);
    }

    if (brand?.length > 0) {
      matchStage.brand = new mongoose.Types.ObjectId(brand[0]);
    }

    if (customer?.length > 0) {
      matchStage.customer = new mongoose.Types.ObjectId(customer[0]);
    }
    if (salesContract?.length > 0) {
      matchStage.salesContract = new mongoose.Types.ObjectId(salesContract[0]);
    }

    if (Adm) matchStage['return_adm'] = true;
    if (nonAdm) matchStage['return_adm'] = false;

    //  Sales Contract match stage
    const scMatchStage: any = { isDeleted: false };
    if (royality_approval == 'true')
      scMatchStage['salesContracts.royality_approval'] = true;
    if (royality_approval == 'false')
      scMatchStage['salesContracts.royality_approval'] = false;

    const basePipeline: any[] = [
      {
        $match: matchStage,
      },
      {
        $lookup: {
          from: 'salescontractdtls',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'salesContracts',
        },
      },
      {
        $unwind: {
          path: '$salesContracts',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: scMatchStage,
      },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'products',
        },
      },
      {
        $unwind: {
          path: '$products',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customers',
        },
      },
      {
        $unwind: {
          path: '$customers',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brands',
        },
      },
      {
        $unwind: {
          path: '$brands',
          // includeArrayIndex: 'string',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          returnNo: '$retNo',
          returnDate: '$returnDate',
          shipmentNo: '$shipmentTran',
          shipmentDate: '$shipmentDate',
          customer: '$customers.name',
          contract: '$contract',
          brand: '$brands.name',
          product: '$products.name',
          shipRate: '$shipRate',
          shipQty: '$shipQty',
          returnQty: '$returnQty',
          balance: '$balance',
          actualQty: '$actualQty',
          actualAmount: '$actualAmount',
        },
      },
      {
        $sort: {
          returnDate: -1,
        },
      },
    ];
    const basePipelineSummary: any[] = [
      {
        $match: matchStage,
      },
      {
        $lookup: {
          from: 'salescontractdtls',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'salesContracts',
        },
      },
      {
        $unwind: {
          path: '$salesContracts',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: scMatchStage,
      },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'products',
        },
      },
      {
        $unwind: {
          path: '$products',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customers',
        },
      },
      {
        $unwind: {
          path: '$customers',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brands',
        },
      },
      {
        $unwind: {
          path: '$brands',
          // includeArrayIndex: 'string',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          returnNo: '$retNo',
          returnDate: '$returnDate',
          shipmentNo: '$shipmentTran',
          shipmentDate: '$shipmentDate',
          customer: '$customers.name',
          brand: '$brands.name',
          product: '$products.name',
          contract: '$contract',
          balance: '$balance',
          shipRate: '$shipRate',
          shipQty: '$shipQty',
          returnQty: '$returnQty',
          actualQty: '$actualQty',
          actualAmount: '$actualAmount',
        },
      },
      {
        $sort: {
          returnDate: -1,
        },
      },
    ];

    const groupStage = {
      $group: {
        _id: '',
        product: { $first: '$product' },
        brand: { $first: '$brand' },
        customer: { $first: '$customer' },
        totalShipQty: { $sum: '$shipQty' },
        totalReturnQty: { $sum: '$returnQty' },
        totalActualQty: { $sum: '$actualQty' },
        totalBalance: { $sum: '$balance' },
        totalActualAmount: { $sum: '$actualAmount' },
        totalReturns: { $sum: 1 },
      },
    };

    const groupStageSummary = {
      $group: {
        _id: '',
        product: { $first: '$product' },
        brand: { $first: '$brand' },
        customer: { $first: '$customer' },
        totalShipQty: { $sum: '$shipQty' },
        totalReturnQty: { $sum: '$returnQty' },
        totalActualQty: { $sum: '$actualQty' },
        totalBalance: { $sum: '$balance' },
        totalActualAmount: { $sum: '$actualAmount' },
        totalReturns: { $sum: 1 },
      },
    };
    // If grouping is not required, we can skip the group stage
    const dataPipeline = shouldGroup
      ? [...basePipeline, groupStage, { $skip: skipCount }, { $limit: limit }]
      : [...basePipeline, { $skip: skipCount }, { $limit: limit }];

    // Count pipeline for total records
    const countPipeline = shouldGroup
      ? [...basePipeline, groupStage, { $count: 'totalRecords' }]
      : [...basePipeline, { $count: 'totalRecords' }];

    // Summary pipeline for total records
    const summaryPipeline = shouldGroup
      ? [...basePipelineSummary, groupStageSummary]
      : [
          ...basePipelineSummary,
          {
            $group: {
              _id: null,
              totalShipQty: { $sum: '$shipQty' },
              totalBalance: { $sum: '$balance' },
              totalReturnQty: { $sum: '$returnQty' },
              totalActualQty: { $sum: '$actualQty' },
              totalActualAmount: { $sum: '$actualAmount' },
            },
          },
        ];

    // Executing the pipelines in parallel
    const [netreturndtl, totalResult, summaryResult] = await Promise.all([
      ReturnModel.aggregate(dataPipeline, { allowDiskUse: true }),
      ReturnModel.aggregate(countPipeline, { allowDiskUse: true }),
      ReturnModel.aggregate(summaryPipeline, { allowDiskUse: true }),
    ]);
    // Extracting total records and summary from the results
    const totalRecords = totalResult?.[0]?.totalRecords || 0;

    const summary = summaryResult?.[0] || {
      totalShipQty: 0,
      totalReturnQty: 0,
      totalActualQty: 0,
      totalBalance: 0,
      totalActualAmount: 0,
    };
    return {
      netreturndtl,
      summary,
      pagination: {
        page: pageno,
        perPage,
        totalRecords,
        totalPages: Math.ceil(totalRecords / perPage),
      },
    };
  } catch (e) {
    console.error('Error in findReturnDtlsByDate:', e);
    throw e;
  }
};

export const findReturnDtlsByDatePrint = async (
  input: ReturnReportPrintSchema
) => {
  try {
    const {
      brand,
      customer,
      salesContract,
      product,
      fromDate,
      toDate,
      royality_approval,
      Adm,
      nonAdm,
      brandgroup,
      customergroup,
      productgroup,
    } = input;

    const groupId: any = {};
    const shouldGroup = productgroup || brandgroup || customergroup;

    if (productgroup) groupId.product = '$product';
    if (brandgroup) groupId.brand = '$brand';
    if (customergroup) groupId.customer = '$customer';

    const matchStage: any = { isDeleted: false };

    if (fromDate && toDate) {
      matchStage.returnDate = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    }

    if (product?.length > 0) {
      matchStage.product = new mongoose.Types.ObjectId(product[0]);
    }

    if (brand?.length > 0) {
      matchStage.brand = new mongoose.Types.ObjectId(brand[0]);
    }

    if (customer?.length > 0) {
      matchStage.customer = new mongoose.Types.ObjectId(customer[0]);
    }
    if (salesContract?.length > 0) {
      matchStage.salesContract = new mongoose.Types.ObjectId(salesContract[0]);
    }

    if (Adm) matchStage['return_adm'] = true;
    if (nonAdm) matchStage['return_adm'] = false;

    //  Sales Contract match stage
    const scMatchStage: any = { isDeleted: false };
    if (royality_approval == 'true')
      scMatchStage['salesContracts.royality_approval'] = true;
    if (royality_approval == 'false')
      scMatchStage['salesContracts.royality_approval'] = false;

    // const basePipeline: any[] = [
    //   {
    //     $match: matchStage,
    //   },
    //   {
    //     $lookup: {
    //       from: 'salescontractdtls',
    //       localField: 'salesContract',
    //       foreignField: 'salesContract',
    //       as: 'salesContracts',
    //     },
    //   },
    //   {
    //     $unwind: {
    //       path: '$salesContracts',
    //       preserveNullAndEmptyArrays: true,
    //     },
    //   },
    //   {
    //     $match: scMatchStage,
    //   },
    //   {
    //     $lookup: {
    //       from: 'products',
    //       localField: 'product',
    //       foreignField: '_id',
    //       as: 'products',
    //     },
    //   },
    //   {
    //     $unwind: {
    //       path: '$products',
    //       preserveNullAndEmptyArrays: true,
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'customers',
    //       localField: 'customer',
    //       foreignField: '_id',
    //       as: 'customers',
    //     },
    //   },
    //   {
    //     $unwind: {
    //       path: '$customers',
    //       preserveNullAndEmptyArrays: true,
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: 'brands',
    //       localField: 'brand',
    //       foreignField: '_id',
    //       as: 'brands',
    //     },
    //   },
    //   {
    //     $unwind: {
    //       path: '$brands',
    //       preserveNullAndEmptyArrays: true,
    //     },
    //   },
    //   {
    //     $project: {
    //       returnNo: '$retNo',
    //       returnDate: '$returnDate',
    //       shipmentNo: '$shipmentTran',
    //       shipmentDate: '$shipmentDate',
    //       customer: '$customers.name',
    //       brand: '$brands.name',
    //       product: '$products.name',
    //       contract: '$contract',
    //       shipRate: '$shipRate',
    //       shipQty: '$shipQty',
    //       returnQty: '$returnQty',
    //       balance: '$balance',
    //       actualQty: '$actualQty',
    //       actualAmount: '$actualAmount',
    //     },
    //   },
    //   {
    //     $sort: {
    //       returnDate: -1,
    //     },
    //   },
    // ];

    const basePipeline: any[] = [
      {
        $match: matchStage,
      },
      {
        $lookup: {
          from: 'salescontractdtls',
          localField: 'salesContract',
          foreignField: 'salesContract',
          as: 'salesContract',
        },
      },
      {
        $unwind: {
          path: '$salesContract',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: scMatchStage,
      },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'products',
        },
      },
      {
        $unwind: {
          path: '$products',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customers',
        },
      },
      {
        $unwind: {
          path: '$customers',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'brand',
          foreignField: '_id',
          as: 'brands',
        },
      },
      {
        $unwind: {
          path: '$brands',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          returnNo: '$retNo',
          returnDate: '$returnDate',
          shipmentNo: '$shipmentTran',
          shipmentDate: '$shipmentDate',
          customer: '$customers.name',
          brand: '$brands.name',
          product: '$products.name',
          contract: '$contract',
          shipRate: '$shipRate',
          shipQty: '$shipQty',
          returnQty: '$returnQty',
          balance: '$balance',
          actualQty: '$actualQty',
          actualAmount: '$actualAmount',
        },
      },
      {
        $sort: {
          returnDate: -1,
        },
      },
    ];

    const groupStage = {
      $group: {
        _id: groupId,
        product: { $first: '$product' },
        brand: { $first: '$brand' },
        customer: { $first: '$customer' },
        totalShipQty: { $sum: '$shipQty' },
        totalReturnQty: { $sum: '$returnQty' },
        totalBalance: { $sum: '$balance' },
        totalActualQty: { $sum: '$actualQty' },
        totalActualAmount: { $sum: '$actualAmount' },
        totalReturns: { $sum: 1 },
      },
    };

    const groupStageSummary = {
      $group: {
        _id: '',
        product: { $first: '$product' },
        brand: { $first: '$brand' },
        customer: { $first: '$customer' },
        totalShipQty: { $sum: '$shipQty' },
        totalReturnQty: { $sum: '$returnQty' },
        totalBalance: { $sum: '$balance' },
        totalActualQty: { $sum: '$actualQty' },
        totalActualAmount: { $sum: '$actualAmount' },
        totalReturns: { $sum: 1 },
      },
    };
    // If grouping is not required, we can skip the group stage
    const dataPipeline = shouldGroup
      ? [...basePipeline, groupStage]
      : [...basePipeline];

    // Summary pipeline for total records
    const summaryPipeline = shouldGroup
      ? [...basePipeline, groupStageSummary]
      : [
          ...basePipeline,
          {
            $group: {
              _id: null,
              totalShipQty: { $sum: '$shipQty' },
              totalReturnQty: { $sum: '$returnQty' },
              totalBalance: { $sum: '$balance' },
              totalActualQty: { $sum: '$actualQty' },
              totalActualAmount: { $sum: '$actualAmount' },
            },
          },
        ];

    // Executing the pipelines in parallel
    const [netreturndtl, summaryResult] = await Promise.all([
      ReturnModel.aggregate(dataPipeline, { allowDiskUse: true }),
      ReturnModel.aggregate(summaryPipeline, { allowDiskUse: true }),
    ]);
    // Extracting total records and summary from the results
    const summary = summaryResult?.[0] || {
      totalShipQty: 0,
      totalReturnQty: 0,
      totalBalance: 0,
      totalActualQty: 0,
      totalActualAmount: 0,
    };
    return {
      netreturndtl,
      summary,
    };
  } catch (e) {
    console.error('Error in findReturnDtlsByDate:', e);
    throw e;
  }
};
