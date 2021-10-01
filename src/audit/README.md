# Audit Resources

## Usage

### Deploy with the primary account.

```typescript
    new AuditResources(this, id, {
      projectName: process.env.PROJECT_NAME!,
    });
```

### Deploy with the secondary account.

```typescript
    new AuditResources(this, id, {
      projectName: process.env.PROJECT_NAME!,
      principal: {
        primary: {
          accountId: cdk.Stack.of(this).account,
        }
      },
    });
```
