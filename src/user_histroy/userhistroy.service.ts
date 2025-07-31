// import fastify from 'fastify';
import fastifySession from 'fastify-session';
import mongoose, { ObjectId } from 'mongoose';
import { UserHistroyModel } from './userhistroy.model';
import { config } from '../../src/utils/config';
import moment from 'moment';
import momentTime from 'moment-timezone';
import { userHistroyReportSchema } from './userhistroy.schema';


const fastify = require('fastify')();




export const userLog = async (
    request: { session: any; ip: any; method: any; url: any; },
    success: boolean | undefined,
    userEmail: string,
    userId: ObjectId,
    userName: string,
    publicIP: string,
    body: any,
) => {
    try {

        const LastUser = await UserHistroyModel.findOne().sort({ id: -1 })
        const id = LastUser ? LastUser.id + 1 : 1;
        if (!userEmail || !userId || !request.method || !request.url || !request.ip || success === undefined || !userName) {
            throw new Error('Required parameters are missing!');
        }
        const payload = JSON.stringify(body);

        const userDetail = await UserHistroyModel.create({
            id: id,
            userEmail: userEmail,
            ApiMethod: request.method,
            urls: request.url,
            ip_Address: publicIP,
            userid: userId,
            TimeIn: momentTime().tz("Asia/Karachi").format("HH:mm:ss"),
            Date: moment(new Date()).format('YYYY-MM-DD'),
            success: success,
            username: userName,
            payload: payload,
        });





        return userDetail;
    } catch (error) {

        console.error('Error logging user action:', error);
        return { error: 'Failed to log user action' };
    }
};

export const userLogReport = async (input: userHistroyReportSchema) => {

    const limit = input.perPage;
    const skipCount = (input.pageno - 1) * limit;


    if (input.ApiMethod == 'All' || input.ApiMethod == '' && input.ip_Address == '' && input.userEmail == '' && input.username == '') {

        const fromDate = moment('2024-03-18T00:00:00.000Z'); // Assuming fromDate and toDate are provided
        const toDate = moment('2024-03-19T00:00:00.000Z');
        const userhistroy = await UserHistroyModel.aggregate([
            {
                $match: {
                    Date: {
                        $gte: new Date(input.fromDate), // Convert moment object to Date
                        $lte: new Date(input.toDate)
                    }
                }
            },
            {
                $lookup: {

                    from: "users",
                    localField: "userid",
                    foreignField: "_id",
                    as: "user_info"
                }

            },
            { $skip: skipCount },
            { $limit: limit },
            { $sort: { Date: 1 } }

        ]);
        const records = await UserHistroyModel.aggregate([
            {
                $match: {
                    Date: {
                        $gte: new Date(input.fromDate), // Convert moment object to Date
                        $lte: new Date(input.toDate)
                    }
                }
            },
            {
                $lookup: {

                    from: "users",
                    localField: "userid",
                    foreignField: "_id",
                    as: "user_info"
                }

            },


        ]);
        const result = {
            user_detail: userhistroy,
            total_records: records.length,
            paginated_record: userhistroy.length

        }
        return result


    }
    else if (input.userEmail !== '' || input.username !== '' || input.ip_Address !== '' || input.ApiMethod !== '') {

        let where = {};
        if (input.username && input.userEmail && input.ip_Address && input.ApiMethod) {
            where = {
                username: new RegExp(`^${input?.username}`, 'i'),
                userEmail: new RegExp(`^${input?.userEmail}`, 'i'),
                ip_Address: new RegExp(`^${input?.ip_Address}`, 'i'),
                ApiMethod: new RegExp(`^${input?.ApiMethod}`, 'i')
            };
        }
        else if(input.userEmail && input.ip_Address && input.ApiMethod){
            where = {
                userEmail: new RegExp(`^${input?.userEmail}`, 'i'),
                ip_Address: new RegExp(`^${input?.ip_Address}`, 'i'),
                ApiMethod: new RegExp(`^${input?.ApiMethod}`, 'i')
            };
        }
        else if (input.username && input.userEmail) {
            where = {
                username: new RegExp(`^${input?.username}`, 'i'),
                userEmail: new RegExp(`^${input?.userEmail}`, 'i'),
            };
        }
        else if (input.ip_Address && input.ApiMethod) {
            where = {
                ip_Address: new RegExp(`^${input?.ip_Address}`, 'i'),
                ApiMethod: new RegExp(`^${input?.ApiMethod}`, 'i')
            };
        }
        else if (input.username && input.ip_Address) {
            where = {
                ip_Address: new RegExp(`^${input?.ip_Address}`, 'i'),
                username: new RegExp(`^${input?.username}`, 'i')
            };
        }
        else if (input.username && input.ApiMethod) {
            where = {
                username: new RegExp(`^${input?.username}`, 'i'),
                ApiMethod: new RegExp(`^${input?.ApiMethod}`, 'i')
            };
        }
        else if (input.userEmail && input.ApiMethod) {
            where = {
                userEmail: new RegExp(`^${input?.userEmail}`, 'i'),
                ApiMethod: new RegExp(`^${input?.ApiMethod}`, 'i')
            };
        }
        else if (input.userEmail && input.ip_Address) {
            where = {
                userEmail: new RegExp(`^${input?.userEmail}`, 'i'),
                ip_Address: new RegExp(`^${input?.ip_Address}`, 'i')
            };
        }
        else if (input.username) {
            where = {
                username: new RegExp(`^${input?.username}`, 'i'),
            };
        }
        else if (input.userEmail) {
            where = {
                userEmail: new RegExp(`^${input?.userEmail}`, 'i'),
            };
        }
        else if (input.ApiMethod) {
            where = {
                ApiMethod: new RegExp(`^${input?.ApiMethod}`, 'i')
            };
        }
        else if (input.ip_Address) {
            where = {
                ip_Address: new RegExp(`^${input?.ip_Address}`, 'i'),
            };
        }






        const userhistory = await UserHistroyModel.aggregate([
            {
                $match: {
                    Date: {
                        $gte: new Date(input.fromDate),
                        $lte: new Date(input.toDate),
                    }
                }
            },
            {
                $match: where
            },
            {
                $lookup: {
                    from: "users",
                    localField: "userid",
                    foreignField: "_id",
                    as: "user_info"
                }
            },
            { $skip: skipCount },
            { $limit: limit },
            { $sort: { Date: 1 } }
        ]);


        const Records = await UserHistroyModel.aggregate([
            {
                $match: {
                    Date: {
                        $gte: new Date(input.fromDate),
                        $lte: new Date(input.toDate),
                    }
                }
            },
            {
                $match: where
            },
            {
                $lookup: {
                    from: "users",
                    localField: "userid",
                    foreignField: "_id",
                    as: "user_info"
                }
            },

        ]);
        const result = {
            user_detail: userhistory,
            total_records: Records.length,
            paginated_records: userhistory.length

        }
        return result


    }
}


// export const userLogReport = async (input: userHistroyReportSchema) => {
//     const limit = input.perPage;
//     const skipCount = (input.pageno - 1) * limit;

//     // Construct the base match condition for date range
//     const matchCondition: any = {
//         Date: {
//             $gte: new Date(input.fromDate),
//             $lte: new Date(input.toDate),
//         }
//     };

//     // Construct additional match conditions for non-empty filters
//     if (input.userEmail || input.username || input.ip_Address || input.ApiMethod) {
//         matchCondition.$or = [];
//         if (input.userEmail) matchCondition.$or.push({ userEmail: input.userEmail });
//         if (input.username) matchCondition.$or.push({ username: input.username });
//         if (input.ip_Address) matchCondition.$or.push({ ip_Address: input.ip_Address });
//         if (input.ApiMethod) matchCondition.$or.push({ ApiMethod: input.ApiMethod });
//     }

//     // Aggregate pipeline for user history
//     const userHistoryPipeline = [
//         { $match: matchCondition },
//         { $lookup: { from: "users", localField: "userid", foreignField: "_id", as: "user_info" } },
//         { $skip: skipCount },
//         { $limit: limit },
//         { $sort: { id: 1 } }
//     ];

//     // Aggregate pipeline for total records
//     const totalRecordsPipeline = [
//         { $match: matchCondition },
//         { $lookup: { from: "users", localField: "userid", foreignField: "_id", as: "user_info" } }
//     ];

//     // Execute aggregate queries
//     const [user_detail, total_records] = await Promise.all([
//         UserHistroyModel.aggregate(userHistoryPipeline),
//         UserHistroyModel.aggregate(totalRecordsPipeline)
//     ]);

//     // Prepare result object
//     const result = {
//         user_detail,
//         total_records: total_records.length,
//         paginated_records: user_detail.length
//     };

//     return result;
// }


export const userLogDeleteAll = async () => {


    const deleteall = await UserHistroyModel.deleteMany({})
    return deleteall;
}










export default fastify