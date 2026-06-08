import json, urllib.request
base='http://localhost:5000'
# login
req=urllib.request.Request(base+'/api/auth/login', data=json.dumps({'email':'admin@demo.local','password':'Admin123!'}).encode(), headers={'Content-Type':'application/json'})
with urllib.request.urlopen(req) as r:
    resp=json.load(r)
token=resp['data']['token']
print('TOKEN_OK')
# create resource
payload={'name':'Room X','type':'Consultation room','location':'First floor','capacity':'1 staff, 2 customers','usage':10,'status':'Available'}
req2=urllib.request.Request(base+'/api/resources', data=json.dumps(payload).encode(), headers={'Content-Type':'application/json','Authorization':f'Bearer {token}'}, method='POST')
with urllib.request.urlopen(req2) as r:
    resp2=json.load(r)
print(json.dumps(resp2))
