// Generated automatically by nearley, version 2.16.0
// http://github.com/Hardmath123/nearley
// Bypasses TS6133. Allow declared but unused functions.
// @ts-ignore
function id(d: any[]): any { return d[0]; }
declare var PROGRAM: any;
declare var ID: any;
declare var OPBRACE: any;
declare var CLBRACE: any;
declare var GLOBAL: any;
declare var COLON: any;
declare var SCOLON: any;
declare var INT: any;
declare var FLOAT: any;
declare var CHAR: any;
declare var LOGIC: any;
declare var VOID: any;
declare var COMMA: any;
declare var OPBRAK: any;
declare var CLBRAK: any;
declare var INTCT: any;
declare var FUNCTIONS: any;
declare var MAIN: any;
declare var OPPAR: any;
declare var CLPAR: any;
declare var LOCAL: any;
declare var STATEMENTS: any;
declare var IF: any;
declare var ELSE: any;
declare var WHILE: any;
declare var DO: any;
declare var FOR: any;
declare var ASSIGN: any;
declare var READ: any;
declare var WRITE: any;
declare var STRING: any;
declare var CALL: any;
declare var RETURN: any;
declare var OR: any;
declare var AND: any;
declare var NOT: any;
declare var RELOP: any;
declare var ADOP: any;
declare var MULTOP: any;
declare var FLOATCT: any;
declare var CHARCT: any;
declare var TRUE: any;
declare var FALSE: any;
declare var NEG: any;

const lexer = require('../lexycon/lexer').lexer

export interface Token { value: any; [key: string]: any };

export interface Lexer {
  reset: (chunk: string, info: any) => void;
  next: () => Token | undefined;
  save: () => any;
  formatError: (token: Token) => string;
  has: (tokenType: string) => boolean
};

export interface NearleyRule {
  name: string;
  symbols: NearleySymbol[];
  postprocess?: (d: any[], loc?: number, reject?: {}) => any
};

export type NearleySymbol = string | { literal: any } | { test: (token: any) => boolean };

export var Lexer: Lexer | undefined = lexer;

export var ParserRules: NearleyRule[] = [
    {"name": "Prog", "symbols": [(lexer.has("PROGRAM") ? {type: "PROGRAM"} : PROGRAM), (lexer.has("ID") ? {type: "ID"} : ID), (lexer.has("OPBRACE") ? {type: "OPBRACE"} : OPBRACE), "GlobDecls", "Functions", (lexer.has("CLBRACE") ? {type: "CLBRACE"} : CLBRACE)], "postprocess": 
        data => ({
            nodeName: 'Prog',
            nodeChildren: data
        })
        },
    {"name": "GlobDecls", "symbols": [], "postprocess": 
        data => ({
            nodeName: 'GlobDecls',
            nodeChildren: data
        })
        },
    {"name": "GlobDecls", "symbols": [(lexer.has("GLOBAL") ? {type: "GLOBAL"} : GLOBAL), (lexer.has("COLON") ? {type: "COLON"} : COLON), "DeclList"], "postprocess": 
        data => ({
            nodeName: 'GlobDecls',
            nodeChildren: data
        })
        },
    {"name": "DeclList", "symbols": ["Declaration"], "postprocess": 
        data => ({
            nodeName: 'DeclList',
            nodeChildren: data
        })
        },
    {"name": "DeclList", "symbols": ["DeclList", "Declaration"], "postprocess": 
        data => ({
            nodeName: 'DeclList',
            nodeChildren: data
        })
        },
    {"name": "Declaration", "symbols": ["Type", "ElemList", (lexer.has("SCOLON") ? {type: "SCOLON"} : SCOLON)], "postprocess": 
        data => ({
            nodeName: 'Declaration',
            nodeChildren: data
        })
        },
    {"name": "Type", "symbols": [(lexer.has("INT") ? {type: "INT"} : INT)], "postprocess": 
        data => ({
            nodeName: 'Type',
            nodeChildren: data
        })
        },
    {"name": "Type", "symbols": [(lexer.has("FLOAT") ? {type: "FLOAT"} : FLOAT)], "postprocess": 
        data => ({
            nodeName: 'Type',
            nodeChildren: data
        })
        },
    {"name": "Type", "symbols": [(lexer.has("CHAR") ? {type: "CHAR"} : CHAR)], "postprocess": 
        data => ({
            nodeName: 'Type',
            nodeChildren: data
        })
        },
    {"name": "Type", "symbols": [(lexer.has("LOGIC") ? {type: "LOGIC"} : LOGIC)], "postprocess": 
        data => ({
            nodeName: 'Type',
            nodeChildren: data
        })
        },
    {"name": "Type", "symbols": [(lexer.has("VOID") ? {type: "VOID"} : VOID)], "postprocess": 
        data => ({
            nodeName: 'Type',
            nodeChildren: data
        })
        },
    {"name": "ElemList", "symbols": ["Elem"], "postprocess": 
        data => ({
            nodeName: 'ElemList',
            nodeChildren: data
        })
        },
    {"name": "ElemList", "symbols": ["ElemList", (lexer.has("COMMA") ? {type: "COMMA"} : COMMA), "Elem"], "postprocess": 
        data => ({
            nodeName: 'ElemList',
            nodeChildren: data
        })
        },
    {"name": "Elem", "symbols": [(lexer.has("ID") ? {type: "ID"} : ID), "Dims"], "postprocess": 
        data => ({
            nodeName: 'Elem',
            nodeChildren: data
        })
        },
    {"name": "Dims", "symbols": [], "postprocess": 
        data => ({
            nodeName: 'Dims',
            nodeChildren: data
        })
        },
    {"name": "Dims", "symbols": [(lexer.has("OPBRAK") ? {type: "OPBRAK"} : OPBRAK), "DimList", (lexer.has("CLBRAK") ? {type: "CLBRAK"} : CLBRAK)], "postprocess": 
        data => ({
            nodeName: 'Dims',
            nodeChildren: data
        })
        },
    {"name": "DimList", "symbols": [(lexer.has("INTCT") ? {type: "INTCT"} : INTCT)], "postprocess": 
        data => ({
            nodeName: 'DimList',
            nodeChildren: data
        })
        },
    {"name": "DimList", "symbols": ["DimList", (lexer.has("COMMA") ? {type: "COMMA"} : COMMA), (lexer.has("INTCT") ? {type: "INTCT"} : INTCT)], "postprocess": 
        data => ({
            nodeName: 'DimList',
            nodeChildren: data
        })
        },
    {"name": "Functions", "symbols": [(lexer.has("FUNCTIONS") ? {type: "FUNCTIONS"} : FUNCTIONS), (lexer.has("COLON") ? {type: "COLON"} : COLON), "FuncList"], "postprocess": 
        data => ({
            nodeName: 'Functions',
            nodeChildren: data
        })
        },
    {"name": "FuncList", "symbols": ["Function"], "postprocess": 
        data => ({
            nodeName: 'FuncList',
            nodeChildren: data
        })
        },
    {"name": "FuncList", "symbols": ["FuncList", "Function"], "postprocess": 
        data => ({
            nodeName: 'FuncList',
            nodeChildren: data
        })
        },
    {"name": "Function", "symbols": ["Header", (lexer.has("OPBRACE") ? {type: "OPBRACE"} : OPBRACE), "LocDecls", "Stats", (lexer.has("CLBRACE") ? {type: "CLBRACE"} : CLBRACE)], "postprocess": 
        data => ({
            nodeName: 'Function',
            nodeChildren: data
        })
        },
    {"name": "Header", "symbols": [(lexer.has("MAIN") ? {type: "MAIN"} : MAIN)], "postprocess": 
        data => ({
            nodeName: 'Header',
            nodeChildren: data
        })
        },
    {"name": "Header", "symbols": ["Type", (lexer.has("ID") ? {type: "ID"} : ID), (lexer.has("OPPAR") ? {type: "OPPAR"} : OPPAR), "Params", (lexer.has("CLPAR") ? {type: "CLPAR"} : CLPAR)], "postprocess": 
        data => ({
            nodeName: 'Header',
            nodeChildren: data
        })
        },
    {"name": "Params", "symbols": [], "postprocess": 
        data => ({
            nodeName: 'Params',
            nodeChildren: data
        })
        },
    {"name": "Params", "symbols": ["ParamList"], "postprocess": 
        data => ({
            nodeName: 'Params',
            nodeChildren: data
        })
        },
    {"name": "ParamList", "symbols": ["Parameter"], "postprocess": 
        data => ({
            nodeName: 'ParamList',
            nodeChildren: data
        })
        },
    {"name": "ParamList", "symbols": ["ParamList", (lexer.has("COMMA") ? {type: "COMMA"} : COMMA), "Parameter"], "postprocess": 
        data => ({
            nodeName: 'ParamList',
            nodeChildren: data
        })
        },
    {"name": "Parameter", "symbols": ["Type", (lexer.has("ID") ? {type: "ID"} : ID)], "postprocess": 
        data => ({
            nodeName: 'Parameter',
            nodeChildren: data
        })
        },
    {"name": "LocDecls", "symbols": [], "postprocess": 
        data => ({
            nodeName: 'LocDecls',
            nodeChildren: data
        })
        },
    {"name": "LocDecls", "symbols": [(lexer.has("LOCAL") ? {type: "LOCAL"} : LOCAL), (lexer.has("COLON") ? {type: "COLON"} : COLON), "DeclList"], "postprocess": 
        data => ({
            nodeName: 'LocDecls',
            nodeChildren: data
        })
        },
    {"name": "Stats", "symbols": [(lexer.has("STATEMENTS") ? {type: "STATEMENTS"} : STATEMENTS), (lexer.has("COLON") ? {type: "COLON"} : COLON), "StatList"], "postprocess": 
        data => ({
            nodeName: 'Stats',
            nodeChildren: data
        })
        },
    {"name": "StatList", "symbols": [], "postprocess": 
        data => ({
            nodeName: 'StatList',
            nodeChildren: data
        })
        },
    {"name": "StatList", "symbols": ["StatList", "Statement"], "postprocess": 
        data => ({
            nodeName: 'StatList',
            nodeChildren: data
        })
        },
    {"name": "Statement", "symbols": ["CompStat"], "postprocess": 
        data => ({
            nodeName: 'Statement',
            nodeChildren: data
        })
        },
    {"name": "Statement", "symbols": ["IfStat"], "postprocess": 
        data => ({
            nodeName: 'Statement',
            nodeChildren: data
        })
        },
    {"name": "Statement", "symbols": ["WhileStat"], "postprocess": 
        data => ({
            nodeName: 'Statement',
            nodeChildren: data
        })
        },
    {"name": "Statement", "symbols": ["DoStat"], "postprocess": 
        data => ({
            nodeName: 'Statement',
            nodeChildren: data
        })
        },
    {"name": "Statement", "symbols": ["ForStat"], "postprocess": 
        data => ({
            nodeName: 'Statement',
            nodeChildren: data
        })
        },
    {"name": "Statement", "symbols": ["ReadStat"], "postprocess": 
        data => ({
            nodeName: 'Statement',
            nodeChildren: data
        })
        },
    {"name": "Statement", "symbols": ["WriteStat"], "postprocess": 
        data => ({
            nodeName: 'Statement',
            nodeChildren: data
        })
        },
    {"name": "Statement", "symbols": ["AssignStat"], "postprocess": 
        data => ({
            nodeName: 'Statement',
            nodeChildren: data
        })
        },
    {"name": "Statement", "symbols": ["CallStat"], "postprocess": 
        data => ({
            nodeName: 'Statement',
            nodeChildren: data
        })
        },
    {"name": "Statement", "symbols": ["ReturnStat"], "postprocess": 
        data => ({
            nodeName: 'Statement',
            nodeChildren: data
        })
        },
    {"name": "Statement", "symbols": [(lexer.has("SCOLON") ? {type: "SCOLON"} : SCOLON)], "postprocess": 
        data => ({
            nodeName: 'Statement',
            nodeChildren: data
        })
        },
    {"name": "CompStat", "symbols": [(lexer.has("OPBRACE") ? {type: "OPBRACE"} : OPBRACE), "StatList", (lexer.has("CLBRACE") ? {type: "CLBRACE"} : CLBRACE)], "postprocess": 
        data => ({
            nodeName: 'CompStat',
            nodeChildren: data
        })
        },
    {"name": "IfStat", "symbols": [(lexer.has("IF") ? {type: "IF"} : IF), (lexer.has("OPPAR") ? {type: "OPPAR"} : OPPAR), "Expression", (lexer.has("CLPAR") ? {type: "CLPAR"} : CLPAR), "Statement", "ElseStat"], "postprocess": 
        data => ({
            nodeName: 'IfStat',
            nodeChildren: data
        })
        },
    {"name": "ElseStat", "symbols": [], "postprocess": 
        data => ({
            nodeName: 'ElseStat',
            nodeChildren: data
        })
        },
    {"name": "ElseStat", "symbols": [(lexer.has("ELSE") ? {type: "ELSE"} : ELSE), "Statement"], "postprocess": 
        data => ({
            nodeName: 'ElseStat',
            nodeChildren: data
        })
        },
    {"name": "WhileStat", "symbols": [(lexer.has("WHILE") ? {type: "WHILE"} : WHILE), (lexer.has("OPPAR") ? {type: "OPPAR"} : OPPAR), "Expression", (lexer.has("CLPAR") ? {type: "CLPAR"} : CLPAR), "Statement"], "postprocess": 
        data => ({
            nodeName: 'WhileStat',
            nodeChildren: data
        })
        },
    {"name": "DoStat", "symbols": [(lexer.has("DO") ? {type: "DO"} : DO), "Statement", (lexer.has("WHILE") ? {type: "WHILE"} : WHILE), (lexer.has("OPPAR") ? {type: "OPPAR"} : OPPAR), "Expression", (lexer.has("CLPAR") ? {type: "CLPAR"} : CLPAR), (lexer.has("SCOLON") ? {type: "SCOLON"} : SCOLON)], "postprocess": 
        data => ({
            nodeName: 'DoStat',
            nodeChildren: data
        })
        },
    {"name": "ForStat", "symbols": [(lexer.has("FOR") ? {type: "FOR"} : FOR), (lexer.has("OPPAR") ? {type: "OPPAR"} : OPPAR), "Variable", (lexer.has("ASSIGN") ? {type: "ASSIGN"} : ASSIGN), "Expression", (lexer.has("SCOLON") ? {type: "SCOLON"} : SCOLON), "Expression", (lexer.has("SCOLON") ? {type: "SCOLON"} : SCOLON), "Variable", (lexer.has("ASSIGN") ? {type: "ASSIGN"} : ASSIGN), "Expression", (lexer.has("CLPAR") ? {type: "CLPAR"} : CLPAR), "Statement"], "postprocess": 
        data => ({
            nodeName: 'ForStat',
            nodeChildren: data
        })
        },
    {"name": "ReadStat", "symbols": [(lexer.has("READ") ? {type: "READ"} : READ), (lexer.has("OPPAR") ? {type: "OPPAR"} : OPPAR), "ReadList", (lexer.has("CLPAR") ? {type: "CLPAR"} : CLPAR), (lexer.has("SCOLON") ? {type: "SCOLON"} : SCOLON)], "postprocess": 
        data => ({
            nodeName: 'ReadStat',
            nodeChildren: data
        })
        },
    {"name": "ReadList", "symbols": ["Variable"], "postprocess": 
        data => ({
            nodeName: 'ReadList',
            nodeChildren: data
        })
        },
    {"name": "ReadList", "symbols": ["ReadList", (lexer.has("COMMA") ? {type: "COMMA"} : COMMA), "Variable"], "postprocess": 
        data => ({
            nodeName: 'ReadList',
            nodeChildren: data
        })
        },
    {"name": "WriteStat", "symbols": [(lexer.has("WRITE") ? {type: "WRITE"} : WRITE), (lexer.has("OPPAR") ? {type: "OPPAR"} : OPPAR), "WriteList", (lexer.has("CLPAR") ? {type: "CLPAR"} : CLPAR), (lexer.has("SCOLON") ? {type: "SCOLON"} : SCOLON)], "postprocess": 
        data => ({
            nodeName: 'WriteStat',
            nodeChildren: data
        })
        },
    {"name": "WriteList", "symbols": ["WriteElem"], "postprocess": 
        data => ({
            nodeName: 'WriteList',
            nodeChildren: data
        })
        },
    {"name": "WriteList", "symbols": ["WriteList", (lexer.has("COMMA") ? {type: "COMMA"} : COMMA), "WriteElem"], "postprocess": 
        data => ({
            nodeName: 'WriteList',
            nodeChildren: data
        })
        },
    {"name": "WriteElem", "symbols": [(lexer.has("STRING") ? {type: "STRING"} : STRING)], "postprocess": 
        data => ({
            nodeName: 'WriteElem',
            nodeChildren: data
        })
        },
    {"name": "WriteElem", "symbols": ["Expression"], "postprocess": 
        data => ({
            nodeName: 'WriteElem',
            nodeChildren: data
        })
        },
    {"name": "CallStat", "symbols": [(lexer.has("CALL") ? {type: "CALL"} : CALL), "FuncCall", (lexer.has("SCOLON") ? {type: "SCOLON"} : SCOLON)], "postprocess": 
        data => ({
            nodeName: 'CallStat',
            nodeChildren: data
        })
        },
    {"name": "FuncCall", "symbols": [(lexer.has("ID") ? {type: "ID"} : ID), (lexer.has("OPPAR") ? {type: "OPPAR"} : OPPAR), "Arguments", (lexer.has("CLPAR") ? {type: "CLPAR"} : CLPAR)], "postprocess": 
        data => ({
            nodeName: 'FuncCall',
            nodeChildren: data
        })
        },
    {"name": "Arguments", "symbols": [], "postprocess": 
        data => ({
            nodeName: 'Arguments',
            nodeChildren: data
        })
        },
    {"name": "Arguments", "symbols": ["ExprList"], "postprocess": 
        data => ({
            nodeName: 'Arguments',
            nodeChildren: data
        })
        },
    {"name": "ReturnStat", "symbols": [(lexer.has("RETURN") ? {type: "RETURN"} : RETURN), (lexer.has("SCOLON") ? {type: "SCOLON"} : SCOLON)], "postprocess": 
        data => ({
            nodeName: 'ReturnStat',
            nodeChildren: data
        })
        },
    {"name": "ReturnStat", "symbols": [(lexer.has("RETURN") ? {type: "RETURN"} : RETURN), "Expression", (lexer.has("SCOLON") ? {type: "SCOLON"} : SCOLON)], "postprocess": 
        data => ({
            nodeName: 'ReturnStat',
            nodeChildren: data
        })
        },
    {"name": "AssignStat", "symbols": ["Variable", (lexer.has("ASSIGN") ? {type: "ASSIGN"} : ASSIGN), "Expression", (lexer.has("SCOLON") ? {type: "SCOLON"} : SCOLON)], "postprocess": 
        data => ({
            nodeName: 'AssignStat',
            nodeChildren: data
        })
        },
    {"name": "ExprList", "symbols": ["Expression"], "postprocess": 
        data => ({
            nodeName: 'ExprList',
            nodeChildren: data
        })
        },
    {"name": "ExprList", "symbols": ["ExprList", (lexer.has("COMMA") ? {type: "COMMA"} : COMMA), "Expression"], "postprocess": 
        data => ({
            nodeName: 'ExprList',
            nodeChildren: data
        })
        },
    {"name": "Expression", "symbols": ["AuxExpr1"], "postprocess": 
        data => ({
            nodeName: 'Expression',
            nodeChildren: data
        })
        },
    {"name": "Expression", "symbols": ["Expression", (lexer.has("OR") ? {type: "OR"} : OR), "AuxExpr1"], "postprocess": 
        data => ({
            nodeName: 'Expression',
            nodeChildren: data
        })
        },
    {"name": "AuxExpr1", "symbols": ["AuxExpr2"], "postprocess": 
        data => ({
            nodeName: 'AuxExpr1',
            nodeChildren: data
        })
        },
    {"name": "AuxExpr1", "symbols": ["AuxExpr1", (lexer.has("AND") ? {type: "AND"} : AND), "AuxExpr2"], "postprocess": 
        data => ({
            nodeName: 'AuxExpr1',
            nodeChildren: data
        })
        },
    {"name": "AuxExpr2", "symbols": ["AuxExpr3"], "postprocess": 
        data => ({
            nodeName: 'AuxExpr2',
            nodeChildren: data
        })
        },
    {"name": "AuxExpr2", "symbols": [(lexer.has("NOT") ? {type: "NOT"} : NOT), "AuxExpr3"], "postprocess": 
        data => ({
            nodeName: 'AuxExpr2',
            nodeChildren: data
        })
        },
    {"name": "AuxExpr3", "symbols": ["AuxExpr4"], "postprocess": 
        data => ({
            nodeName: 'AuxExpr3',
            nodeChildren: data
        })
        },
    {"name": "AuxExpr3", "symbols": ["AuxExpr4", (lexer.has("RELOP") ? {type: "RELOP"} : RELOP), "AuxExpr4"], "postprocess": 
        data => ({
            nodeName: 'AuxExpr3',
            nodeChildren: data
        })
        },
    {"name": "AuxExpr4", "symbols": ["Term"], "postprocess": 
        data => ({
            nodeName: 'AuxExpr4',
            nodeChildren: data
        })
        },
    {"name": "AuxExpr4", "symbols": ["AuxExpr4", (lexer.has("ADOP") ? {type: "ADOP"} : ADOP), "Term"], "postprocess": 
        data => ({
            nodeName: 'AuxExpr4',
            nodeChildren: data
        })
        },
    {"name": "Term", "symbols": ["Factor"], "postprocess": 
        data => ({
            nodeName: 'Term',
            nodeChildren: data
        })
        },
    {"name": "Term", "symbols": ["Term", (lexer.has("MULTOP") ? {type: "MULTOP"} : MULTOP), "Factor"], "postprocess": 
        data => ({
            nodeName: 'Term',
            nodeChildren: data
        })
        },
    {"name": "Factor", "symbols": ["Variable"], "postprocess": 
        data => ({
            nodeName: 'Factor',
            nodeChildren: data
        })
        },
    {"name": "Factor", "symbols": [(lexer.has("INTCT") ? {type: "INTCT"} : INTCT)], "postprocess": 
        data => ({
            nodeName: 'Factor',
            nodeChildren: data
        })
        },
    {"name": "Factor", "symbols": [(lexer.has("FLOATCT") ? {type: "FLOATCT"} : FLOATCT)], "postprocess": 
        data => ({
            nodeName: 'Factor',
            nodeChildren: data
        })
        },
    {"name": "Factor", "symbols": [(lexer.has("CHARCT") ? {type: "CHARCT"} : CHARCT)], "postprocess": 
        data => ({
            nodeName: 'Factor',
            nodeChildren: data
        })
        },
    {"name": "Factor", "symbols": [(lexer.has("TRUE") ? {type: "TRUE"} : TRUE)], "postprocess": 
        data => ({
            nodeName: 'Factor',
            nodeChildren: data
        })
        },
    {"name": "Factor", "symbols": [(lexer.has("FALSE") ? {type: "FALSE"} : FALSE)], "postprocess": 
        data => ({
            nodeName: 'Factor',
            nodeChildren: data
        })
        },
    {"name": "Factor", "symbols": [(lexer.has("NEG") ? {type: "NEG"} : NEG), "Factor"], "postprocess": 
        data => ({
            nodeName: 'Factor',
            nodeChildren: data
        })
        },
    {"name": "Factor", "symbols": [(lexer.has("ADOP") ? {type: "ADOP"} : ADOP), "Factor"], "postprocess": 
        data => ({
            nodeName: 'Factor',
            nodeChildren: data
        })
        },
    {"name": "Factor", "symbols": [(lexer.has("OPPAR") ? {type: "OPPAR"} : OPPAR), "Expression", (lexer.has("CLPAR") ? {type: "CLPAR"} : CLPAR)], "postprocess": 
        data => ({
            nodeName: 'Factor',
            nodeChildren: data
        })
        },
    {"name": "Factor", "symbols": ["FuncCall"], "postprocess": 
        data => ({
            nodeName: 'Factor',
            nodeChildren: data
        })
        },
    {"name": "Variable", "symbols": [(lexer.has("ID") ? {type: "ID"} : ID), "Subscripts"], "postprocess": 
        data => ({
            nodeName: 'Variable',
            nodeChildren: data
        })
        },
    {"name": "Subscripts", "symbols": [], "postprocess": 
        data => ({
            nodeName: 'Subscripts',
            nodeChildren: data
        })
        },
    {"name": "Subscripts", "symbols": [(lexer.has("OPBRAK") ? {type: "OPBRAK"} : OPBRAK), "SubscrList", (lexer.has("CLBRAK") ? {type: "CLBRAK"} : CLBRAK)], "postprocess": 
        data => ({
            nodeName: 'Subscripts',
            nodeChildren: data
        })
        },
    {"name": "SubscrList", "symbols": ["AuxExpr4"], "postprocess": 
        data => ({
            nodeName: 'SubscrList',
            nodeChildren: data
        })
        },
    {"name": "SubscrList", "symbols": ["SubscrList", (lexer.has("COMMA") ? {type: "COMMA"} : COMMA), "AuxExpr4"], "postprocess": 
        data => ({
            nodeName: 'SubscrList',
            nodeChildren: data
        })
        }
];

export var ParserStart: string = "Prog";
