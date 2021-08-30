## cdk-common

## Usage

### Network Foundation

#### Step1. Deploy with the master account.

```typescript
    new VpcResources(this, id, {
      projectName: process.env.ProjectName!,
      cidrBlock: process.env.VpcCidrBlock!,
      principal: {
        accountIds: [ process.env.AnotherAccountID! ],      // aws account id
        vpcCidrBlock: [ process.env.AnotherVpcCidrBlock! ], // vpc cidrblock
        tgwAttachmentIds: [],
      },
    });
```

#### Step2. Deploy with the child account.

notice : Need to approve the share of the transitgateway before execution.

```typescript
    new VpcResources(this, id, {
      projectName: process.env.ProjectName!,
      cidrBlock: process.env.VpcCidrBlock!,
      principal: {
        transitGatewayId: process.env.TransitGatewayId!, // master account's transit gateway id
      },
    });
```

#### Step3. Deploy with the master account.

```typescript
    new VpcResources(this, id, {
      projectName: process.env.ProjectName!,
      cidrBlock: process.env.VpcCidrBlock!,
      principal: {
        accountIds: [ process.env.AnotherAccountID! ],              // aws account id
        vpcCidrBlock: [ process.env.AnotherVpcCidrBlock! ],         // vpc cidrblock
        tgwAttachmentIds: [ process.env.AnotherTGWAttachmentID! ],  // transit gateway attachement id
      },
    });
```

### Mesh Foundation

```typescript
  private createMeshResources(scope: cdk.Construct, id: string, props: { projectName: string, serviceName: string, mesh: appmesh.IMesh, namespace: PrivateDnsNamespace }) {
    const resource = new MeshResources(scope, id, {
      projectName: props.projectName,
      serviceName: props.serviceName,
      mesh: props.mesh,
      vRouterListeners: [appmesh.VirtualRouterListener.http(9080)],             // VirtualRouteListener
      nodes: [
        {
          name: 'app1',                                                         // VirtualNodeName
          service: props.namespace.createService('Service', { name: 'app1' }),  // ServiceDiscovery::Service
          vNodeListeners: [appmesh.VirtualNodeListener.http({ port: 9080 })],   // VirtualNodeListener
          weight: 1
        }
      ]
    });
    resource.vRouter.addRoute('Route', {
      routeName: props.projectName,
      routeSpec: appmesh.RouteSpec.http({ weightedTargets: resource.weightedTargets, match: { path: appmesh.HttpRoutePathMatch.startsWith('/') } }) // RouteSpec
    });
  }
```
