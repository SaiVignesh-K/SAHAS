const mongoose=require('mongoose');

const ProblemSchema= new mongoose.Schema({
    ProblemID:Number,
    ProblemName:String,
    ProblemStatement:String,
    ProblemDifficulty:String,
    ProblemTestCasesInput:String,
    ProblemTestCasesOutput:String,
    ProblemHiddenTestCasesInput:String,
    ProblemHiddenTestCasesOutput:String,
    ProblemSuccessfullSubmissions:Number
})

const ProblemModel=mongoose.model("Problems", ProblemSchema)
module.exports=ProblemModel