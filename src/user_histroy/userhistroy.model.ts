import { getModelForClass, prop, Ref } from '@typegoose/typegoose';
import { Types } from 'mongoose';





export class UserHistroy {

    @prop({
        type: Number,
        default: 0,
    })
    id: number
    @prop({
        type: String,

    })
    userEmail: string
    @prop({
        type: String
    })
    username: string
    @prop({
        type: String,

    })
    TimeIn: string
    @prop({
        type: String,

    })
    ApiMethod: string
    @prop({
        type: String
    })
    urls: string
    @prop({
        type: String,

    })
    ip_Address: string
    @prop({
        type: Date,
        default: null
    })
    Timeout: Date
    @prop({ default: null, type: Types.ObjectId })
    userid: Types.ObjectId

    @prop({
        type: Boolean,
        default: null
    })
    success: boolean
    @prop({
        type: Date,
        default: null
    })
    Date: Date

   @prop({
        type: [String] // Define the type of the array elements
    })
    payload?: string[];
}
export const UserHistroyModel = getModelForClass(UserHistroy, {
    schemaOptions: {
        timestamps: true,
    },
});