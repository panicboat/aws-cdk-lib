# Network Foundation

## Usage

### Step1. Deploy with the primary account.

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

### Step2. Deploy with the secondary account.

notice : Need to approve the share of the transitgateway before execution.

```typescript
    new VpcResources(this, id, {
      projectName: process.env.ProjectName!,
      cidrBlock: process.env.VpcCidrBlock!,
      principal: {
        transitGatewayId: process.env.TransitGatewayId!, // primary account's transit gateway id
      },
    });
```

### Step3. Deploy with the primary account.

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
