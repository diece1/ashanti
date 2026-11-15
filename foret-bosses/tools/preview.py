import sys, json
from PIL import Image
ROOT='/home/claude/foret-bosses/'
def sheet(boss, kinds, out, cell=(190,230), bgc=(90,100,140), cols=12):
    m=json.load(open(f'{ROOT}assets/boss/{boss}/manifest.json')); keys=[k for k,v in m.items() if v['kind'] in kinds]
    rows=(len(keys)+cols-1)//cols; W=Image.new('RGB',(cols*cell[0],rows*cell[1]),bgc)
    for i,k in enumerate(keys):
        im=Image.open(ROOT+m[k]['file']).convert('RGBA'); im.thumbnail((cell[0]-6,cell[1]-6)); W.paste(im,((i%cols)*cell[0]+3,(i//cols)*cell[1]+3),im)
    W.save(out)
if __name__=='__main__':
    sheet(sys.argv[1], sys.argv[3].split(','), sys.argv[2], bgc=tuple(int(x) for x in sys.argv[4].split(',')) if len(sys.argv)>4 else (90,100,140), cols=int(sys.argv[5]) if len(sys.argv)>5 else 10)
