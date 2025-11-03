// This is a test file with some common issues that the code review should catch
Testing this PR // not a comment by the way
// Missing semicolons
const x = 10
const y = 20

// Unused variables
const z = 30;

// Function without documentation
function calculateSum(a, b) {
  return a + b
}

// Inconsistent spacing
function calculateProduct(a,b){
  return a*b;
}

// Potential bug: missing return statement
function divide(a, b) {
  if (b === 0) {
    console.log("Cannot divide by zero");
    // Missing return statement
  }
  return a / b;
}

// Inefficient code
function findMax(arr) {
  let max = arr[0];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > max) {
      max = arr[i];
    }
  }
  return max;
}

// Security issue: eval
function executeCode(code) {
  return eval(code); // random comment in a test file
}

// Call the functions
console.log(calculateSum(x, y));
console.log(calculateProduct(x, y));
console.log(divide(x, y));
console.log(findMax([x, y, z]));
