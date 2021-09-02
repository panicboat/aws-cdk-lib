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
