#include <fstream>
#include <iostream>

const int STACK_SIZE = 8096;

enum class MemoryWordType { Int, Char, Float, Logic };

struct MemoryWord {
  MemoryWordType type;
  union MemoryWordContent {
    int asInt;
    char asChar;
    bool asBool;
    float asFloat;
  } content;
};

inline int hashInstruction(char* input) {
  int sum = 0;
  int length = 0;
  while (input[length] != '\0') length++;

  for (int i = 0; i < length; i++) {
    sum += input[i] * (length - i);
  }
  return sum % 83;  // 83 = minimal for no collision
}

inline int hashRegister(char* input) {
  int sum = 0;
  int length = 0;
  while (input[length] != '\0') length++;

  for (int i = 0; i < length; i++) {
    sum += input[i] * (length - i);
  }
  return sum % 21;  // 21 = minimal for no collision
}

struct RuntimeState {
  // indexed by register hash. hence not all are usable (actually, only 8 of
  // them)
  MemoryWord registers[21];
  MemoryWord RAM[STACK_SIZE];
  bool finishedExecution;
};

enum class OperandType {
  Immediate,
  RelativeAddress,
  AbsoluteAddress,
  Register,
  Empty
};

struct Operand {
  OperandType type;
  union OperandValue {
    int asRegisterHash;
    int asAbsoluteAddress;
    struct RelativeAddress {
      int relativeTo;
      int displacement;
    } asRelativeAddress;
    MemoryWord asImmediate;
  } value;
};

struct RelativeAddress {};

/**
 * At most 3 operands (not all instructions have 3)
 */
struct Instruction {
  int opcodeHash;
  Operand op1;
  Operand op2;
  Operand op3;
};

/**
 * Modifies `lastRead` to inform the last-read character
 *
 * Must be called when input is exactly at the position where the int starts
 */
inline int parseInt(char* lastRead, std::ifstream& input) {
  using namespace std;
  char c;
  int result = 0;
  bool isNegative = false;
  input.read(&c, 1);
  if (c == '-') {
    isNegative = true;
    input.read(&c, 1);
  }
  while (true) {
    if (c < '0' || c > '9') break;
    result = result * 10 + (c - '0');
    input.read(&c, 1);
  }
  *lastRead = c;
  if (isNegative) {
    result = -result;
  }
  return result;
}

/**
 * Modifies `lastRead` to inform the last-read character.
 *
 * Must be called when input is exactly at the position where the float starts
 */
inline float parseFloat(char* lastRead, std::ifstream& input) {
  using namespace std;
  char c;
  int integerPart = parseInt(&c, input);
  int sign = integerPart < 0 ? -1 : 1;
  float fractionaryPart = 0;
  if (c == '.') {
    float divider = 10;
    while (true) {
      input.read(&c, 1);
      if (c < '0' || c > '9') break;
      fractionaryPart += ((float)(c - '0')) / divider;
      divider *= 10;
    }
  }
  *lastRead = c;
  float result = integerPart + sign * fractionaryPart;
  return result;
}

/**
 * Fills `operand`. Modifies `lastRead` to inform last-read character
 *
 * Must be called when input is exactly at the position where the operand starts
 */
inline void parseOperand(Operand& operand, char* lastRead,
                         std::ifstream& input) {
  using namespace std;
  char c;
  input.read(&c, 1);

  // found an immediate
  if (c == '<') {
    operand.type = OperandType::Immediate;
    input.read(&c, 1);
    switch (c) {
      case 'i':
        input.seekg(3, input.cur);  // <i nt>
        operand.value.asImmediate.type = MemoryWordType::Int;
        operand.value.asImmediate.content.asInt = parseInt(&c, input);
        break;

      case 'f':
        input.seekg(5, input.cur);  // <f loat>
        operand.value.asImmediate.type = MemoryWordType::Float;
        operand.value.asImmediate.content.asFloat = parseFloat(&c, input);
        break;

      case 'l':
        input.seekg(5, input.cur);  // <l ogic>
        operand.value.asImmediate.type = MemoryWordType::Logic;
        operand.value.asImmediate.content.asBool = (bool)parseInt(&c, input);
        break;

      case 'c':
        input.seekg(4, input.cur);  // <c har>
        operand.value.asImmediate.type = MemoryWordType::Char;
        operand.value.asImmediate.content.asChar = (char)parseInt(&c, input);
        break;

      default:
        return;
    }
  }
  // either an absolute or a relative address
  else if (c == 'M') {
    input.seekg(1, input.cur);  // [
    c = input.peek();
    // found a relative address (begins by naming a register)
    if (c >= 'A' && c <= 'Z') {
      operand.type = OperandType::RelativeAddress;
      // find register name
      char regname[4];  // all registers have <= 3 characters for name
      int i = 0;
      while (true) {
        input.read(&c, 1);
        if (!(c >= 'A' && c <= 'Z') && !(c >= '0' && c <= '9')) break;
        regname[i++] = c;
      }
      regname[i] = '\0';
      operand.value.asRelativeAddress.relativeTo = hashRegister(regname);

      // an explicit displacement will come next
      if (c == ' ') {
        input.read(&c, 1);
        int sign;
        if (c == '+') {
          sign = +1;
        } else {
          sign = -1;
        }
        input.seekg(1, input.cur);  // skip space that comes after the '+'/'-'
        int displacement = parseInt(&c, input);  // stops at the ']'
        operand.value.asRelativeAddress.displacement = sign * displacement;
      }
      // c is ']'. displacement is implicitly 0
      else {
        operand.value.asRelativeAddress.displacement = 0;
      }

      input.read(&c, 1);  // whatever comes after the ']' character
    }
    // found an absolute address
    else {
      operand.type = OperandType::AbsoluteAddress;
      operand.value.asAbsoluteAddress = parseInt(&c, input);
    }
  }
  // found a register
  else {
    operand.type = OperandType::Register;
    // find register name
    char regname[4];  // all registers have <= 3 characters for name
    int i = 0;
    while (true) {
      if (!(c >= 'A' && c <= 'Z') && !(c >= '0' && c <= '9')) break;
      regname[i++] = c;
      input.read(&c, 1);
    }
    regname[i] = '\0';
    operand.value.asRegisterHash = hashRegister(regname);
  }
  *lastRead = c;
}

void printOperand(Operand op) {
  using namespace std;
  switch (op.type) {
    case OperandType::Empty:
      return;
      break;

    case OperandType::Immediate:
      switch (op.value.asImmediate.type) {
        case MemoryWordType::Int:
          cout << "<int>" << op.value.asImmediate.content.asInt;
          break;

        case MemoryWordType::Float:
          cout << "<float>" << op.value.asImmediate.content.asFloat;
          break;

        case MemoryWordType::Logic:
          cout << "<logic>" << op.value.asImmediate.content.asBool;
          break;

        case MemoryWordType::Char:
          cout << "<char>" << op.value.asImmediate.content.asInt;
          break;

        default:
          break;
      }
      break;

    case OperandType::Register:
      cout << "registerHash(" << op.value.asRegisterHash << ")";
      break;

    case OperandType::AbsoluteAddress:
      cout << "M[" << op.value.asAbsoluteAddress << "]";
      break;

    case OperandType::RelativeAddress:
      cout << "M[registerHash(" << op.value.asRelativeAddress.relativeTo
           << ") + " << op.value.asRelativeAddress.displacement << "]";
      break;

    default:
      break;
  }
}

void printPartialStack(RuntimeState& state, int count) {
  using namespace std;
  for (int i = STACK_SIZE - 1; i > STACK_SIZE - count - 1; i--) {
    cout << "-----------------" << endl;
    auto const word = state.RAM[i];
    switch (word.type) {
      case MemoryWordType::Int:
        cout << i << ": " << word.content.asInt << endl;
        break;

      case MemoryWordType::Char:
        cout << i << ": " << word.content.asChar << endl;
        break;

      case MemoryWordType::Float:
        cout << i << ": " << word.content.asFloat << endl;
        break;

      case MemoryWordType::Logic:
        cout << i << ": " << word.content.asBool << endl;
        break;

      default:
        break;
    }
  }
  cout << "-----------------" << endl;
}

void printRegisters(RuntimeState& state) {
  using namespace std;
  for (auto i : {"EIP", "ESP", "EBP", "ERV", "R0", "R1", "R2"}) {
    auto word = state.registers[hashRegister((char*)i)];
    switch (word.type) {
      case MemoryWordType::Int:
        cout << i << ": " << word.content.asInt << endl;
        break;

      case MemoryWordType::Char:
        cout << i << ": " << word.content.asChar << endl;
        break;

      case MemoryWordType::Float:
        cout << i << ": " << word.content.asFloat << endl;
        break;

      case MemoryWordType::Logic:
        cout << i << ": " << word.content.asBool << endl;
        break;

      default:
        break;
    }
  }
}

inline MemoryWord* resolveMemoryWord(Operand& op, RuntimeState& state) {
  switch (op.type) {
    case OperandType::Register:
      return &state.registers[op.value.asRegisterHash];
      break;

    case OperandType::AbsoluteAddress:
      return &state.RAM[op.value.asAbsoluteAddress];
      break;

    case OperandType::RelativeAddress:
      return &state.RAM[state.registers[op.value.asRelativeAddress.relativeTo]
                            .content.asInt +
                        op.value.asRelativeAddress.displacement];
      break;

    case OperandType::Immediate:
      return &op.value.asImmediate;

    default:
      break;
  }
}

#define typedContent(op1)                                                \
  (op1->type == MemoryWordType::Int                                      \
       ? op1->content.asInt                                              \
       : op1->type == MemoryWordType::Char                               \
             ? op1->content.asChar                                       \
             : op1->type == MemoryWordType::Float ? op1->content.asFloat \
                                                  : op1->content.asBool)

#define assignContent(destination, newValue)                            \
  ((destination)->type == MemoryWordType::Int                           \
       ? (destination)->content.asInt = (int)(newValue)                 \
       : (destination)->type == MemoryWordType::Char                    \
             ? (destination)->content.asChar = (char)(newValue)         \
             : (destination)->type == MemoryWordType::Float             \
                   ? (destination)->content.asFloat = (float)(newValue) \
                   : (destination)->content.asBool = (bool)(newValue))

#define generalizeType(op1, op2)                                              \
  ((op1->type == MemoryWordType::Float || op2->type == MemoryWordType::Float) \
       ? MemoryWordType::Float                                                \
       : (op1->type == MemoryWordType::Logic &&                               \
          op2->type == MemoryWordType::Logic)                                 \
             ? MemoryWordType::Logic                                          \
             : MemoryWordType::Int)

#define reg(name, state) (state.registers[hashRegister(name)])

#define inceip(state) (state.registers[hashRegister("EIP")].content.asInt++)

void handleADD(Instruction& inst, RuntimeState& state) {
  MemoryWord* op1 = resolveMemoryWord(inst.op1, state);
  MemoryWord* op2 = resolveMemoryWord(inst.op2, state);
  MemoryWord* destination = resolveMemoryWord(inst.op3, state);
  destination->type = generalizeType(op1, op2);
  assignContent(destination, typedContent(op1) + typedContent(op2));
}

void handleAND(Instruction& inst, RuntimeState& state) {
  MemoryWord* op1 = resolveMemoryWord(inst.op1, state);
  MemoryWord* op2 = resolveMemoryWord(inst.op2, state);
  MemoryWord* destination = resolveMemoryWord(inst.op3, state);
  destination->type = generalizeType(op1, op2);
  assignContent(destination, typedContent(op1) && typedContent(op2));
}

void handleASS(Instruction& inst, RuntimeState& state) {
  MemoryWord* source = resolveMemoryWord(inst.op1, state);
  MemoryWord* destination = resolveMemoryWord(inst.op2, state);
  assignContent(destination, typedContent(source));
}

void handleCALL(Instruction& inst, RuntimeState& state) {
  MemoryWord* address = resolveMemoryWord(inst.op1, state);
  state.RAM[--reg("ESP", state).content.asInt] = reg("EIP", state);
  reg("EIP", state).content.asInt = address->content.asInt;
}

void handleCAST(Instruction& inst, RuntimeState& state) {
  MemoryWord* op1 = resolveMemoryWord(inst.op1, state);
  MemoryWord* op2 = resolveMemoryWord(inst.op2, state);
  op2->type = op1->type;
}

void handleCEQ(Instruction& inst, RuntimeState& state) {
  MemoryWord* op1 = resolveMemoryWord(inst.op1, state);
  MemoryWord* op2 = resolveMemoryWord(inst.op2, state);
  MemoryWord* destination = resolveMemoryWord(inst.op3, state);
  destination->type = generalizeType(op1, op2);
  assignContent(destination, typedContent(op1) == typedContent(op2));
}

void handleCGE(Instruction& inst, RuntimeState& state) {
  MemoryWord* op1 = resolveMemoryWord(inst.op1, state);
  MemoryWord* op2 = resolveMemoryWord(inst.op2, state);
  MemoryWord* destination = resolveMemoryWord(inst.op3, state);
  destination->type = generalizeType(op1, op2);
  assignContent(destination, typedContent(op1) >= typedContent(op2));
}

void handleCGT(Instruction& inst, RuntimeState& state) {
  MemoryWord* op1 = resolveMemoryWord(inst.op1, state);
  MemoryWord* op2 = resolveMemoryWord(inst.op2, state);
  MemoryWord* destination = resolveMemoryWord(inst.op3, state);
  destination->type = generalizeType(op1, op2);
  assignContent(destination, typedContent(op1) > typedContent(op2));
}

void handleCLE(Instruction& inst, RuntimeState& state) {
  MemoryWord* op1 = resolveMemoryWord(inst.op1, state);
  MemoryWord* op2 = resolveMemoryWord(inst.op2, state);
  MemoryWord* destination = resolveMemoryWord(inst.op3, state);
  destination->type = generalizeType(op1, op2);
  assignContent(destination, typedContent(op1) <= typedContent(op2));
}

void handleCLT(Instruction& inst, RuntimeState& state) {
  MemoryWord* op1 = resolveMemoryWord(inst.op1, state);
  MemoryWord* op2 = resolveMemoryWord(inst.op2, state);
  MemoryWord* destination = resolveMemoryWord(inst.op3, state);
  destination->type = generalizeType(op1, op2);
  assignContent(destination, typedContent(op1) < typedContent(op2));
}

void handleCNE(Instruction& inst, RuntimeState& state) {
  MemoryWord* op1 = resolveMemoryWord(inst.op1, state);
  MemoryWord* op2 = resolveMemoryWord(inst.op2, state);
  MemoryWord* destination = resolveMemoryWord(inst.op3, state);
  destination->type = generalizeType(op1, op2);
  assignContent(destination, typedContent(op1) != typedContent(op2));
}

void handleDIV(Instruction& inst, RuntimeState& state) {
  MemoryWord* op1 = resolveMemoryWord(inst.op1, state);
  MemoryWord* op2 = resolveMemoryWord(inst.op2, state);
  MemoryWord* destination = resolveMemoryWord(inst.op3, state);
  destination->type = generalizeType(op1, op2);
  assignContent(destination, typedContent(op1) / typedContent(op2));
}

void handleHALT(Instruction& inst, RuntimeState& state) {
  state.finishedExecution = true;
}

void handleINV(Instruction& inst, RuntimeState& state) {
  MemoryWord* op = resolveMemoryWord(inst.op1, state);
  MemoryWord* destination = resolveMemoryWord(inst.op2, state);
  destination->type = op->type == MemoryWordType::Float ? MemoryWordType::Float
                                                        : MemoryWordType::Int;
  assignContent(destination, -typedContent(op));
}

void handleJEQ(Instruction& inst, RuntimeState& state) {
  MemoryWord* test = resolveMemoryWord(inst.op1, state);
  MemoryWord* address = resolveMemoryWord(inst.op2, state);
  if (typedContent(test) == 0) {
    reg("EIP", state).content.asInt = address->content.asInt;
  }
}

void handleJMP(Instruction& inst, RuntimeState& state) {
  MemoryWord* address = resolveMemoryWord(inst.op1, state);
  reg("EIP", state).content.asInt = address->content.asInt;
}

void handleJNE(Instruction& inst, RuntimeState& state) {
  MemoryWord* test = resolveMemoryWord(inst.op1, state);
  MemoryWord* address = resolveMemoryWord(inst.op2, state);
  if (typedContent(test) != 0) {
    reg("EIP", state).content.asInt = address->content.asInt;
  }
}

void handleMOD(Instruction& inst, RuntimeState& state) {
  MemoryWord* op1 = resolveMemoryWord(inst.op1, state);
  MemoryWord* op2 = resolveMemoryWord(inst.op2, state);
  MemoryWord* destination = resolveMemoryWord(inst.op3, state);
  destination->type = generalizeType(op1, op2);
  assignContent(destination, (int)typedContent(op1) % (int)typedContent(op2));
}

void handleMOV(Instruction& inst, RuntimeState& state) {
  MemoryWord* source = resolveMemoryWord(inst.op1, state);
  MemoryWord* destination = resolveMemoryWord(inst.op2, state);
  destination->type = source->type;
  destination->content = source->content;
}

void handleMULT(Instruction& inst, RuntimeState& state) {
  MemoryWord* op1 = resolveMemoryWord(inst.op1, state);
  MemoryWord* op2 = resolveMemoryWord(inst.op2, state);
  MemoryWord* destination = resolveMemoryWord(inst.op3, state);
  destination->type = generalizeType(op1, op2);
  assignContent(destination, typedContent(op1) * typedContent(op2));
}

void handleNEG(Instruction& inst, RuntimeState& state) {
  MemoryWord* op = resolveMemoryWord(inst.op1, state);
  MemoryWord* destination = resolveMemoryWord(inst.op2, state);
  destination->type = MemoryWordType::Int;
  assignContent(destination, ~(int)typedContent(op));
}

void handleNOT(Instruction& inst, RuntimeState& state) {
  MemoryWord* op = resolveMemoryWord(inst.op1, state);
  MemoryWord* destination = resolveMemoryWord(inst.op2, state);
  destination->type = MemoryWordType::Logic;
  assignContent(destination, !typedContent(op));
}

void handleOR(Instruction& inst, RuntimeState& state) {
  MemoryWord* op1 = resolveMemoryWord(inst.op1, state);
  MemoryWord* op2 = resolveMemoryWord(inst.op2, state);
  MemoryWord* destination = resolveMemoryWord(inst.op3, state);
  destination->type = generalizeType(op1, op2);
  assignContent(destination, typedContent(op1) || typedContent(op2));
}

void handlePOP(Instruction& inst, RuntimeState& state) {
  MemoryWord* destination = resolveMemoryWord(inst.op1, state);
  MemoryWord value = state.RAM[reg("ESP", state).content.asInt++];
  *destination = value;
}

void handlePUSH(Instruction& inst, RuntimeState& state) {
  MemoryWord* content = resolveMemoryWord(inst.op1, state);
  state.RAM[--reg("ESP", state).content.asInt] = *content;
}

void handleREAD(Instruction& inst, RuntimeState& state) {
  using namespace std;
  MemoryWord* destination = resolveMemoryWord(inst.op1, state);
  switch (destination->type) {
    case MemoryWordType::Int:
      scanf("%d", &destination->content.asInt);
      break;

    case MemoryWordType::Char:
      scanf("%c", &destination->content.asChar);
      break;

    case MemoryWordType::Float:
      scanf("%f", &destination->content.asFloat);
      break;

    case MemoryWordType::Logic:
      scanf("%d", &destination->content.asBool);
      break;

    default:
      break;
  }
}

void handleRET(Instruction& inst, RuntimeState& state) {
  using namespace std;
  reg("EIP", state).content.asInt =
      state.RAM[reg("ESP", state).content.asInt++].content.asInt;
}

void handleSUB(Instruction& inst, RuntimeState& state) {
  MemoryWord* op1 = resolveMemoryWord(inst.op1, state);
  MemoryWord* op2 = resolveMemoryWord(inst.op2, state);
  MemoryWord* destination = resolveMemoryWord(inst.op3, state);
  destination->type = generalizeType(op1, op2);
  assignContent(destination, typedContent(op1) - typedContent(op2));
}

void handleWRITE(Instruction& inst, RuntimeState& state) {
  using namespace std;
  MemoryWord* source = resolveMemoryWord(inst.op1, state);
  switch (source->type) {
    case MemoryWordType::Int:
      cout << source->content.asInt;
      break;

    case MemoryWordType::Float:
      cout << source->content.asFloat;
      break;

    case MemoryWordType::Char:
      cout << source->content.asChar;
      break;

    case MemoryWordType::Logic:
      cout << source->content.asBool;
      break;

    default:
      break;
  }
}

int main(int argc, char* argv[]) {
  using namespace std;

  if (argc < 2) {
    cout << "Usage: compita <assembly/file/path>" << endl;
    return 1;
  }

  ifstream input;
  input.open(argv[1]);

  void (*instructionHandlers[83])(Instruction & instruction,
                                  RuntimeState & state);

  RuntimeState state;
  state.registers[hashRegister("EHM")].type = MemoryWordType::Int;
  state.registers[hashRegister("EHM")].content.asInt = STACK_SIZE - 1;
  state.registers[hashRegister("ESP")].type = MemoryWordType::Int;
  state.registers[hashRegister("ESP")].content.asInt = STACK_SIZE - 1;
  state.registers[hashRegister("EIP")].type = MemoryWordType::Int;
  state.registers[hashRegister("EIP")].content.asInt = 0;
  state.registers[hashRegister("EBP")].type = MemoryWordType::Int;
  state.registers[hashRegister("EBP")].content.asInt = 0;
  state.registers[hashRegister("R0")].type = MemoryWordType::Int;
  state.registers[hashRegister("R0")].content.asInt = 0;
  state.finishedExecution = false;

  instructionHandlers[hashInstruction("ADD")] = handleADD;
  instructionHandlers[hashInstruction("AND")] = handleAND;
  instructionHandlers[hashInstruction("ASS")] = handleASS;
  instructionHandlers[hashInstruction("CALL")] = handleCALL;
  instructionHandlers[hashInstruction("CAST")] = handleCAST;
  instructionHandlers[hashInstruction("CEQ")] = handleCEQ;
  instructionHandlers[hashInstruction("CGE")] = handleCGE;
  instructionHandlers[hashInstruction("CGT")] = handleCGT;
  instructionHandlers[hashInstruction("CLE")] = handleCLE;
  instructionHandlers[hashInstruction("CLT")] = handleCLT;
  instructionHandlers[hashInstruction("CNE")] = handleCNE;
  instructionHandlers[hashInstruction("DIV")] = handleDIV;
  instructionHandlers[hashInstruction("HALT")] = handleHALT;
  instructionHandlers[hashInstruction("INV")] = handleINV;
  instructionHandlers[hashInstruction("JEQ")] = handleJEQ;
  instructionHandlers[hashInstruction("JMP")] = handleJMP;
  instructionHandlers[hashInstruction("JNE")] = handleJNE;
  instructionHandlers[hashInstruction("MOD")] = handleMOD;
  instructionHandlers[hashInstruction("MOV")] = handleMOV;
  instructionHandlers[hashInstruction("MULT")] = handleMULT;
  instructionHandlers[hashInstruction("NEG")] = handleNEG;
  instructionHandlers[hashInstruction("NOT")] = handleNOT;
  instructionHandlers[hashInstruction("OR")] = handleOR;
  instructionHandlers[hashInstruction("POP")] = handlePOP;
  instructionHandlers[hashInstruction("PUSH")] = handlePUSH;
  instructionHandlers[hashInstruction("READ")] = handleREAD;
  instructionHandlers[hashInstruction("RET")] = handleRET;
  instructionHandlers[hashInstruction("SUB")] = handleSUB;
  instructionHandlers[hashInstruction("WRITE")] = handleWRITE;

  Instruction program[10000];

  // read all instructions
  Instruction instruction;
  char opcode[10];  // no opcode EVER has 10 characters. Therefore this is safe
  char c;
  int index = 0;
  bool finishedParsing = false;
  while (true) {
    int opcodeLength = 0;
    while (true) {
      if (!input.read(&c, 1)) {
        finishedParsing = true;
        break;
      }
      if (c == '\n' || c == ' ') break;
      opcode[opcodeLength++] = c;
    }
    if (finishedParsing) {
      break;
    }
    opcode[opcodeLength] = '\0';

    instruction.opcodeHash = hashInstruction(opcode);

    if (c == '\n')
      instruction.op1.type = OperandType::Empty;
    else
      parseOperand(instruction.op1, &c, input);

    if (c == '\n')
      instruction.op2.type = OperandType::Empty;
    else
      parseOperand(instruction.op2, &c, input);

    if (c == '\n')
      instruction.op3.type = OperandType::Empty;
    else
      parseOperand(instruction.op3, &c, input);

    program[index++] = instruction;

    // cout << opcode << "(" << hashInstruction(opcode) << ") ";
    // printOperand(instruction.op1);
    // cout << " ";
    // printOperand(instruction.op2);
    // cout << " ";
    // printOperand(instruction.op3);
    // cout << endl;
  }

  for (int i = 0; i < STACK_SIZE; i++) {
    state.RAM[i].content.asInt = 0;
    state.RAM[i].type = MemoryWordType::Int;
  }

  // now execute
  while (!state.finishedExecution) {
    // printRegisters(state);
    // printPartialStack(state, 50);
    // cout << endl;
    // fetch
    instruction = program[reg("EIP", state).content.asInt++];
    // execute
    instructionHandlers[instruction.opcodeHash](instruction, state);
  }

  return 0;
}
