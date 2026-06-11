//元组结合 异步操作

type UntilRes<T1,T2> = 
| [error:null,data:T2]
| [error:T1,data:null]

async function untilAnsync<T1 = Error,T2 = unknown>
(calling:()=> Promise<T2>)
:Promise<UntilRes<T1,T2>>{
  try{
    const data = await calling().catch(
      (error)=>{
        throw error
      })
    return [null,data]
  }
  catch(error:any){
    return [error,null]
  }

}

interface Data {
  id: number
  info: string
}

interface ErrorData{
  res:string
}

function getData(){
  //const data = untilAnsync<ErrorData,Data>()
}

//基础异步代码
//回调
function fecthData(callback:(data: string)=>void){
  setTimeout(()=>{
    callback("基础回调1")
  },1000)
}

//Promises
function fecthData1(data:string,t:number= 500):Promise<string>{
  return new Promise((resolve,reject)=>{
    setTimeout(()=>{
      resolve(data)
    }, t)
  })
}

//async/await
async function test(){
  try{
    const f0 = await fecthData1("await0")
    console.log(f0)
    const f1 = await fecthData1("await1")
    console.log(f1)
    const f2 = await fecthData1("await2")
    console.log(f2)
    const f3 = await fecthData1("await3")
    console.log(f3)
    const f4 = await fecthData1("await4")
    console.log(f4)
    const f5 = await fecthData1("await5")
    console.log(f5)
    const f6 = await fecthData1("await6")
    console.log(f6)
  }
  catch(error){
    console.log(error)
  }
}

//PromiseAll
async function testAll(){
  const [f0,f1,f2,f3,f4] 
  = await Promise.all([
    fecthData1("f0")
    ,fecthData1("f1")
    ,fecthData1("f2")
    ,fecthData1("f3")
    ,fecthData1("f4")
    ])
  console.log(f0)
  console.log(f1)
  console.log(f2)
  console.log(f3)
  console.log(f4)
}

//Promise.race
async function testRace(){
  const fast 
  = await Promise.race([
    fecthData1("f0",100)
    ,fecthData1("f1",200)
    ,fecthData1("f2",300)
    ,fecthData1("f3",400)
    ,fecthData1("f4",1000)
    ])
  console.log(fast)
}

//回调地狱
fecthData((data)=>{
  console.log(data)
  fecthData((data)=>{
    console.log(data)
    fecthData((data)=>{
      console.log(data)
      fecthData((data)=>{
        console.log(data)
      })
    })
  })
})

//Promise优化
fecthData1("Promise0").then((data)=>{
  console.log(data)
  return fecthData1("Promise1")
}).then((data)=>{
  console.log(data)
  return fecthData1("Promise2")
}).then((data)=>{
  console.log(data)
  return fecthData1("Promise3")
}).then((data)=>{
  console.log(data)
  return fecthData1("Promise4")
}).then((data)=>{
  console.log(data)
  return fecthData1("Promise5")
}).then((data)=>{
  console.log(data)
  return fecthData1("Promise6")
}).catch((error)=>{
  console.log(error)
  return fecthData1("Promise7")
})

//async/await优化
test()

//Promise.all使用
testAll()

//PromiseRace
testRace()