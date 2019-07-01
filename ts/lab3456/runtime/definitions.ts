/**
 * Special-purpose registers:
 *
 * ESP: Stack pointer. 
 *      Points at the element on top of the stack. 
 *      Stack grows from high memory to low memory.
 *      ESP begins at the highest memory address
 * EIP: Instruction pointer
 * EBP: Stack-frame-base pointer
 * ERV: Return value holder
 * EHM: Points to the highest memory address available
 * 
 * General-purpose registers:
 * 
 * R0: Always at 0
 * R1
 * R2
 *
 */

/**
 * CALL x does not jump to x. Instead, it jumps to MEM[x]
 */

/**
 * When an instruction begins execution, EIP is already pointing to the 
 * next successive instruction
 */

