#include <iostream>

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
  MemoryWord RAM[8096];
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
  Operand op1;
  Operand op2;
  Operand op3;
};

/**
 * Modifies `lastRead` to inform the last-read character
 *
 * Must be called when cin is exactly at the position where the int starts
 */
inline int parseInt(char* lastRead) {
  using namespace std;
  char c;
  int result = 0;
  bool isNegative = false;
  cin.read(&c, 1);
  if (c == '-') {
    isNegative = true;
    cin.read(&c, 1);
  }
  while (true) {
    if (c < '0' || c > '9') break;
    result = result * 10 + (c - '0');
    cin.read(&c, 1);
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
 * Must be called when cin is exactly at the position where the float starts
 */
inline float parseFloat(char* lastRead) {
  using namespace std;
  char c;
  int integerPart = parseInt(&c);
  int sign = integerPart < 0 ? -1 : 1;
  float fractionaryPart = 0;
  if (c == '.') {
    float divider = 10;
    while (true) {
      cin.read(&c, 1);
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
 * Must be called when cin is exactly at the position where the operand starts
 */
inline void parseOperand(Operand& operand, char* lastRead) {
  using namespace std;
  char c;
  cin.read(&c, 1);

  // found an immediate
  if (c == '<') {
    operand.type = OperandType::Immediate;
    cin.read(&c, 1);
    switch (c) {
      case 'i':
        cin.seekg(3, cin.cur);  // <i nt>
        operand.value.asImmediate.type = MemoryWordType::Int;
        operand.value.asImmediate.content.asInt = parseInt(&c);
        break;

      case 'f':
        cin.seekg(5, cin.cur);  // <f loat>
        operand.value.asImmediate.type = MemoryWordType::Float;
        operand.value.asImmediate.content.asFloat = parseFloat(&c);
        break;

      case 'l':
        cin.seekg(5, cin.cur);  // <l ogic>
        operand.value.asImmediate.type = MemoryWordType::Logic;
        operand.value.asImmediate.content.asBool = (bool)parseInt(&c);
        break;

      case 'c':
        cin.seekg(4, cin.cur);  // <c har>
        operand.value.asImmediate.type = MemoryWordType::Char;
        operand.value.asImmediate.content.asChar = (char)parseInt(&c);
        break;

      default:
        return;
    }
  }
  // either an absolute or a relative address
  else if (c == 'M') {
    cin.seekg(1, cin.cur);  // [
    c = cin.peek();
    // found a relative address (begins by naming a register)
    if (c >= 'A' && c <= 'Z') {
      operand.type = OperandType::RelativeAddress;
      // find register name
      char regname[4];  // all registers have <= 3 characters for name
      int i = 0;
      while (true) {
        cin.read(&c, 1);
        if (!(c >= 'A' && c <= 'Z') && !(c >= '0' && c <= '9')) break;
        regname[i++] = c;
      }
      regname[i] = '\0';
      operand.value.asRelativeAddress.relativeTo = hashRegister(regname);

      // an explicit displacement will come next
      if (c == ' ') {
        cin.read(&c, 1);
        int sign;
        if (c == '+') {
          sign = +1;
        } else {
          sign = -1;
        }
        cin.seekg(1, cin.cur);  // skip space that comes after the '+'/'-'
        int displacement = parseInt(&c);  // stops at the ']'
        operand.value.asRelativeAddress.displacement = sign * displacement;
      }
      // c is ']'. displacement is implicitly 0
      else {
        operand.value.asRelativeAddress.displacement = 0;
      }

      cin.read(&c, 1);  // whatever comes after the ']' character
    }
    // found an absolute address
    else {
      operand.type = OperandType::AbsoluteAddress;
      operand.value.asAbsoluteAddress = parseInt(&c);
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
      cin.read(&c, 1);
    }
    regname[i] = '\0';
    operand.value.asRegisterHash = hashRegister(regname);
  }
  *lastRead = c;
}

void handleMOV(std::string instruction, RuntimeState& state) {}

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

int main() {
  using namespace std;

  void (*instructionHandlers[83])(string instruction, RuntimeState & state);

  RuntimeState state;
  state.registers[hashRegister("EHM")].type = MemoryWordType::Int;
  state.registers[hashRegister("EHM")].content.asInt = 8096;
  state.registers[hashRegister("ESP")].type = MemoryWordType::Int;
  state.registers[hashRegister("ESP")].content.asInt = 8096;
  state.registers[hashRegister("EIP")].type = MemoryWordType::Int;
  state.registers[hashRegister("EIP")].content.asInt = 0;
  state.registers[hashRegister("R0")].type = MemoryWordType::Int;
  state.registers[hashRegister("R0")].content.asInt = 0;

  instructionHandlers[hashInstruction("MOV")] = handleMOV;

  Instruction instruction;

  char opcode[10];  // no opcode EVER has 10 characters. Therefore this is safe
  char c;

  while (true) {
    int opcodeLength = 0;
    while (true) {
      if (!cin.read(&c, 1)) return 0;
      if (c == '\n' || c == ' ') break;
      opcode[opcodeLength++] = c;
    }
    opcode[opcodeLength] = '\0';

    if (c == '\n')
      instruction.op1.type = OperandType::Empty;
    else
      parseOperand(instruction.op1, &c);

    if (c == '\n')
      instruction.op2.type = OperandType::Empty;
    else
      parseOperand(instruction.op2, &c);

    if (c == '\n')
      instruction.op3.type = OperandType::Empty;
    else
      parseOperand(instruction.op3, &c);

    cout << opcode << " ";
    printOperand(instruction.op1);
    cout << " ";
    printOperand(instruction.op2);
    cout << " ";
    printOperand(instruction.op3);
    cout << endl;
  }

  return 0;
}
