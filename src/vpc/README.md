# Network Foundation

## Usage

### Step1. Deploy with the primary account.

```typescript
    new VpcResources(this, id, {
      projectName: process.env.PROJECT_NAME!,
      cidrBlock: process.env.VPC_CIDR_BLOCK!,
      principal: {
        secondary: {
          accountIds: [ process.env.SECONDARY_ACCOUNT_ID! ],
          vpcCidrBlock: [ process.env.SECONDARY_VPC_CIDR_BLOCK! ],
        },
      },
    });
```

### Step2. Deploy with the secondary account.

notice : Need to approve the share of the transitgateway before execution.

```typescript
    new VpcResources(this, id, {
      projectName: process.env.PROJECT_NAME!,
      cidrBlock: process.env.VPC_CIDR_BLOCK!,
      principal: {
        primary: {
          accountId: process.env.PRIMARY_ACCOUNT_ID!,
          transitGatewayId: process.env.TRANSIT_GATEWAY_ID!,
        },
      },
    });
```

### Step3. Deploy with the primary account.

```typescript
    new VpcResources(this, id, {
      projectName: process.env.PROJECT_NAME!,
      cidrBlock: process.env.VPC_CIDR_BLOCK!,
      principal: {
        secondary: {
          accountIds: [ process.env.SECONDARY_ACCOUNT_ID! ],
          vpcCidrBlock: [ process.env.SECONDARY_VPC_CIDR_BLOCK! ],
          tgwAttachmentIds: [ process.env.SECONDARY_TGW_ATTACHMENT_ID! ],
        },
      },
    });
```
