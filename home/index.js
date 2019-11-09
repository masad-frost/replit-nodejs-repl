// console.log('require.resolve=',require.resolve('./'))

console.log(module)

require('./a');
console.log('stuck');
setTimeout(() => {}, 100000000)