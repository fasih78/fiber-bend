import mongoose from 'mongoose';
import { ShipViaModel } from './shipvia.model';
import { CreateShipViaSchema } from './shipvia.schema';

export const createShipVia = async (input: CreateShipViaSchema) => {
  const { ship_via } = input;
  const ShipVia = await ShipViaModel.create({
    ship_via,
  });
  return ShipVia;
};

export const deleteShipVia = async () => {
  return ShipViaModel.deleteMany({});
};
export const deleteShipViaById = async (id: string) => {
  return ShipViaModel.findByIdAndDelete(id);
};

export const updateShipViaById = async (
  _id: string,
  body: CreateShipViaSchema
) => {
  const { ship_via } = body;
  return ShipViaModel.findByIdAndUpdate(_id, {
    ship_via,
  });
};

export const findShipVia = async () => {
  return ShipViaModel.find();
};
