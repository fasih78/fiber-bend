import { getModelForClass, prop } from '@typegoose/typegoose';

export class State {
  @prop({
    type: Number,
    default: 1,
  })
  id: number;

  @prop({
    type: String,
  })
  name: string;
  @prop({
    type: Boolean,
    default: false,
  })
  isDeleted: boolean;
}

export const StateModel = getModelForClass(State, {
  schemaOptions: {
    timestamps: true,
  },
});
