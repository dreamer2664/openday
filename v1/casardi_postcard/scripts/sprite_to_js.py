"""Small, fail-closed source translator for this project's sprite geometry.

It translates the restricted Python subset actually used by character.py and
animals.py, not arbitrary Python. Unsupported syntax raises during the build.
PixelCanvas and Python-compatible arithmetic helpers live in browser/pixels.js.
The generated sprite functions keep the Python source as the source of truth.
"""
from __future__ import annotations
import ast
import json
from pathlib import Path

class Translator:
    def __init__(self):
        self.signatures={};self.serial=0
    def tmp(self):
        self.serial+=1;return '__item'+str(self.serial)
    def collect(self,tree):
        for n in ast.walk(tree):
            if isinstance(n,ast.FunctionDef):self.signatures[n.name]=[a.arg for a in n.args.args]
    def locals(self,body,parameters=()):
        names=set();functions=set()
        def visit(n):
            if isinstance(n,ast.FunctionDef):functions.add(n.name);return
            if isinstance(n,ast.Lambda):return
            if isinstance(n,(ast.ListComp,ast.DictComp,ast.GeneratorExp,ast.SetComp)):return
            if isinstance(n,ast.Name) and isinstance(n.ctx,ast.Store):names.add(n.id)
            for child in ast.iter_child_nodes(n):visit(child)
        for n in body:visit(n)
        return sorted(names-set(parameters)-functions)
    def target(self,n):
        if isinstance(n,ast.Name):return n.id
        if isinstance(n,(ast.List,ast.Tuple)):return '['+','.join(self.target(x) for x in n.elts)+']'
        if isinstance(n,ast.Attribute):return self.e(n.value)+'.'+n.attr
        raise TypeError('Assignment target: '+ast.dump(n))
    def assign(self,target,value):
        if isinstance(target,ast.Subscript):return f'pySet({self.e(target.value)},{self.e(target.slice)},{value});'
        return f'{self.target(target)} = {value};'
    def block(self,body):return '\n'.join(self.s(x) for x in body if not(isinstance(x,ast.Expr) and isinstance(x.value,ast.Constant) and isinstance(x.value.value,str)))
    def s(self,n):
        if isinstance(n,(ast.Import,ast.ImportFrom)):return ''
        if isinstance(n,ast.Expr):return self.e(n.value)+';'
        if isinstance(n,ast.Assign):
            value=self.e(n.value)
            if len(n.targets)>1:
                tmp=self.tmp();return 'const '+tmp+'='+value+';\n'+'\n'.join(self.assign(t,tmp) for t in n.targets)
            return self.assign(n.targets[0],value)
        if isinstance(n,ast.Return):return 'return '+(self.e(n.value) if n.value else 'null')+';'
        if isinstance(n,ast.Continue):return 'continue;'
        if isinstance(n,ast.Pass):return ''
        if isinstance(n,ast.If):return f'if (pyTruth({self.e(n.test)})) {{\n{self.block(n.body)}\n}}'+(' else {\n'+self.block(n.orelse)+'\n}' if n.orelse else '')
        if isinstance(n,ast.For):
            tmp=self.tmp();return f'for (const {tmp} of pyIter({self.e(n.iter)})) {{\n{self.assign(n.target,tmp)}\n{self.block(n.body)}\n}}'
        if isinstance(n,ast.FunctionDef):
            args=[a.arg for a in n.args.args];defaults=n.args.defaults;start=len(args)-len(defaults)
            parameters=[arg+('='+self.e(defaults[i-start]) if i>=start else '') for i,arg in enumerate(args)]
            local=self.locals(n.body,args)
            return 'function '+n.name+'('+','.join(parameters)+') {\n'+('let '+','.join(local)+';\n' if local else '')+self.block(n.body)+'\n}'
        raise TypeError('Unsupported statement: '+ast.dump(n))
    def comp(self,n):
        if len(n.generators)!=1:raise TypeError('Nested comprehension unsupported')
        g=n.generators[0];tmp=self.tmp();local=[]
        def targets(t):
            if isinstance(t,ast.Name):local.append(t.id)
            else:
                for el in t.elts:targets(el)
        targets(g.target)
        dictionary=isinstance(n,ast.DictComp)
        value=f'pySet(__result,{self.e(n.key)},{self.e(n.value)});' if dictionary else f'__result.push({self.e(n.elt)});'
        if g.ifs:value='if ('+' && '.join('pyTruth('+self.e(i)+')' for i in g.ifs)+') {'+value+'}'
        return '(()=>{const __result='+('{}' if dictionary else '[]')+';let '+','.join(dict.fromkeys(local))+';for(const '+tmp+' of pyIter('+self.e(g.iter)+')){'+self.assign(g.target,tmp)+value+'}return __result;})()'
    def e(self,n):
        if isinstance(n,ast.Constant):return json.dumps(n.value,ensure_ascii=False)
        if isinstance(n,ast.Name):return n.id
        if isinstance(n,(ast.Tuple,ast.List,ast.Set)):return '['+','.join(self.e(v) for v in n.elts)+']'
        if isinstance(n,ast.Dict):
            return '({'+','.join('...'+self.e(v) if k is None else '['+self.e(k)+']:'+self.e(v) for k,v in zip(n.keys,n.values))+'})'
        if isinstance(n,ast.Attribute):
            if isinstance(n.value,ast.Name) and n.value.id=='math':
                return {'radians':'pyRadians','hypot':'Math.hypot','sqrt':'Math.sqrt','cos':'Math.cos','sin':'Math.sin'}[n.attr]
            return self.e(n.value)+'.'+n.attr
        if isinstance(n,ast.Subscript):
            if isinstance(n.slice,ast.Slice):
                sl=n.slice;assert sl.step is None
                return '('+self.e(n.value)+').slice('+(self.e(sl.lower) if sl.lower else '0')+(','+self.e(sl.upper) if sl.upper else '')+')'
            return f'pyGet({self.e(n.value)},{self.e(n.slice)})'
        if isinstance(n,ast.BinOp):
            left,right=self.e(n.left),self.e(n.right)
            if isinstance(n.op,ast.FloorDiv):return f'Math.floor({left}/{right})'
            if isinstance(n.op,ast.Mult):return f'pyMul({left},{right})'
            if isinstance(n.op,ast.Mod):return f'pyMod({left},{right})'
            op={ast.Add:'+',ast.Sub:'-',ast.Div:'/',ast.Pow:'**'}[type(n.op)]
            return '('+left+op+right+')'
        if isinstance(n,ast.UnaryOp):return ('!pyTruth('+self.e(n.operand)+')') if isinstance(n.op,ast.Not) else '(-'+self.e(n.operand)+')' if isinstance(n.op,ast.USub) else '(+'+self.e(n.operand)+')'
        if isinstance(n,ast.IfExp):return '(pyTruth('+self.e(n.test)+')?'+self.e(n.body)+':'+self.e(n.orelse)+')'
        if isinstance(n,ast.BoolOp):
            name='pyAnd' if isinstance(n.op,ast.And) else 'pyOr'
            def chain(values):return self.e(values[0]) if len(values)==1 else name+'('+self.e(values[0])+',()=>'+chain(values[1:])+')'
            return chain(n.values)
        if isinstance(n,ast.Compare):
            parts=[];left=n.left
            for op,right in zip(n.ops,n.comparators):
                a,b=self.e(left),self.e(right)
                if isinstance(op,(ast.In,ast.NotIn)):v=f'pyIn({a},{b})';v='!'+v if isinstance(op,ast.NotIn) else v
                elif isinstance(op,(ast.Eq,ast.NotEq)):v=f'pyEq({a},{b})';v='!'+v if isinstance(op,ast.NotEq) else v
                else:v='('+a+{ast.Is:'===',ast.IsNot:'!==',ast.Lt:'<',ast.Gt:'>',ast.LtE:'<=',ast.GtE:'>='}[type(op)]+b+')'
                parts.append(v);left=right
            return '('+' && '.join(parts)+')'
        if isinstance(n,(ast.ListComp,ast.DictComp,ast.GeneratorExp)):return self.comp(n)
        if isinstance(n,ast.Lambda):return '('+','.join(a.arg for a in n.args.args)+')=>('+self.e(n.body)+')'
        if isinstance(n,ast.Call):
            args=[self.e(a) for a in n.args]
            if n.keywords:
                if not isinstance(n.func,ast.Name) or n.func.id not in self.signatures:raise TypeError('Keyword signature unknown: '+ast.unparse(n))
                params=self.signatures[n.func.id]
                for kw in n.keywords:
                    pos=params.index(kw.arg)
                    while len(args)<=pos:args.append('undefined')
                    args[pos]=self.e(kw.value)
            if isinstance(n.func,ast.Attribute):
                obj=self.e(n.func.value);method=n.func.attr
                if method=='get':return 'pyDGet('+','.join([obj]+args)+')'
                if method=='items':return 'pyItems('+obj+')'
                if method=='setdefault':return 'pySetDefault('+','.join([obj]+args)+')'
                if method=='replace':return '('+obj+').split('+args[0]+').join('+args[1]+')'
            fn=self.e(n.func)
            fn={'int':'Math.trunc','round':'pyRound','abs':'Math.abs','min':'Math.min','max':'Math.max','range':'pyRange','enumerate':'pyEnumerate','dict':'pyDict','any':'pyAny'}.get(fn,fn)
            return ('new ' if fn=='PixelCanvas' else '')+fn+'('+','.join(args)+')'
        raise TypeError('Unsupported expression: '+ast.dump(n))
    def module(self,tree):
        local=self.locals(tree.body)
        return ('let '+','.join(local)+';\n' if local else '')+self.block(tree.body)

def generate(root:Path):
    tr=Translator();trees=[ast.parse((root/'app'/f).read_text(encoding='utf-8')) for f in ['sprite_geometry.py','animals.py','cyber_layers.py']]
    for tree in trees:tr.collect(tree)
    return '// Generated helpers/animals/equipment from Python + independent LPC assembler.\n'+\
        'globalThis.CasardiSprites=(()=>{\n'+(root/'browser/pixels.js').read_text()+\
        '\n'+ '\n'.join(tr.module(t) for t in trees)+\
        '\n'+(root/'browser/lpc.js').read_text()+\
        '\nreturn {render,draw_animal,default_spec,PixelCanvas,ramp,compatible,chosenParts,credit};\n})();\n'
