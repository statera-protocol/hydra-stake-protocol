import mongoose from "mongoose";

export const StakeStatus = new mongoose.Schema({
    type: ["active", "claimed"],
    require: true
});

const stakeSchema = new mongoose.Schema({
    encodeUserAddress: {
        type: String,
        require: true
    },
    amount: {
        type: Number,
        require: true
    },
    lock_until_epoch: {
        type: Number,
        require: true
    },
    mt_index: {
        type: Number,
        require: true
    },
    status: StakeStatus
})

const Staker = new mongoose.Model(stakeSchema);

export default Staker;