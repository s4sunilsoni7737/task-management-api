# 🏗️ API Portal — Architectural Blueprint
> **Source:** `admin-road/dev-admin-notification/api-portal`
> **Stack:** NestJS · MongoDB/Mongoose · Swagger (OpenAPI) · Azure Blob Storage · Firebase FCM · NestJS-i18n
> **Purpose:** Reference guide for building consistent, performant controllers and services across any portal project.

---

## 1. Bootstrap & Global Swagger Setup (`main.ts`)

```typescript
// ✅ PATTERN: Swagger is configured ONCE in main.ts — not in controllers
const config = new DocumentBuilder()
  .setTitle('Mobility Advertising API')
  .setDescription('API documentation for Mobility Advertising')
  .setVersion('1.0')
  .addBearerAuth()      // ← enables the 🔒 padlock on all @ApiBearerAuth() routes
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api', app, document);  // UI available at /api
```

**Also registered globally at bootstrap:**
| Feature | Code | Purpose |
|---|---|---|
| URI Versioning | `app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })` | All routes auto-prefixed `/v1/` |
| Global Validation Pipe | `new ValidationPipe({ transform: true, forbidNonWhitelisted: false })` | Activates class-validator + class-transformer on every request |
| HTTP Logger | `app.use(morgan('tiny'))` | Light request logging |
| Timeout Interceptor | `app.useGlobalInterceptors(new TimeoutInterceptor())` | Kills any request hanging > **15 seconds** |
| CORS | `app.enableCors({ origin: ALLOWED_ORIGINS, credentials: true })` | Whitelist-based CORS |

---

## 2. Swagger Used in Controllers

### 2.1 — Class-Level Decorators

```typescript
@ApiTags('Admin')         // Groups all endpoints under "Admin" tag in Swagger UI
@Controller('admin')      // Route prefix: /v1/admin/...
export class AdminController {
  constructor(private readonly adminService: AdminService) {}
}
```

### 2.2 — Route-Level Swagger Decorators

Every route uses a consistent **decorator stack** (order matters for readability):

```typescript
@Get('driver/:driverId')
@ApiBearerAuth()                         // 🔒 Marks route as JWT-protected in Swagger UI
@UseGuards(JwtAdminGuard, PermissionGuard)
@Permission('driver:list')               // RBAC permission key
@ApiParam({                              // Documents path param
  name: 'driverId',
  description: 'MongoDB ObjectId of the driver',
  type: 'string',
  format: 'mongodb ObjectId',
})
async getDriverDetails(@Param('driverId') driverId: string) { ... }
```

| Swagger Decorator | Used On | Purpose |
|---|---|---|
| `@ApiTags('Name')` | Controller class | Group endpoints in Swagger UI sidebar |
| `@ApiBearerAuth()` | Protected routes | Shows 🔒 + requires JWT in Swagger UI |
| `@ApiParam({ name, description, type, format })` | Routes with `:param` | Documents path parameters |
| `@ApiQuery(...)` | Query DTOs are auto-read; manual for headers | Documents query params |
| `@ApiHeader({ name, description, required })` | Routes needing custom headers | Documents `device-id`, `device-type` etc. |
| `@ApiBody({ type: DtoClass })` | POST/PUT routes | Links DTO to request body schema |
| `@ApiConsumes('multipart/form-data')` | File upload routes | Tells Swagger to render file input |

### 2.3 — File Upload Pattern (Multipart)

```typescript
@Post('campaigns')
@ApiConsumes('multipart/form-data')                // ← Swagger: render file pickers
@ApiBody({ type: CreateAdminCampaignDto })          // ← DTO has @ApiProperty({ type: 'string', format: 'binary' })
@UseInterceptors(FileFieldsInterceptor([
  { name: 'leftBannerFile', maxCount: 1 },
  { name: 'rightBannerFile', maxCount: 1 },
], { limits: { fileSize: 5 * 1024 * 1024 } }))     // ← 5MB per file, set in interceptor
async createCampaign(
  @Body() body: CreateAdminCampaignDto,
  @UploadedFiles() files: { leftBannerFile?: Express.Multer.File[] }
) { ... }
```

> **Rule:** File size limits live in the **interceptor**, NOT the DTO.

### 2.4 — Custom Header Pattern

```typescript
@Post('login')
@ApiHeader({ name: 'device-id', description: 'Device ID', required: true })
@ApiHeader({ name: 'device-type', description: '1: Android, 2: iOS, 3: Web', required: true })
async login(
  @Headers('device-id') deviceId: string,
  @Headers('device-type') deviceType: string,
  @Body() body: AdminLoginDto,
) {
  if (!deviceId || !deviceType) {
    throw new BadRequestException({ success: false, developerMessage: '...', data: {} });
  }
  ...
}
```

---

## 3. Swagger Used in DTOs

> **Golden Rule:** Swagger annotations live ONLY in DTOs, NEVER in the controller method body.

### 3.1 — Required vs Optional Fields

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAdminCampaignDto {
  // REQUIRED field — use @ApiProperty
  @ApiProperty({ description: 'Agency ID', example: '694b8daea2313bf330128c04', required: true })
  @IsMongoId()
  @IsNotEmpty()
  agencyId: string;

  // OPTIONAL field — use @ApiPropertyOptional
  @ApiPropertyOptional({ example: 'This campaign is for festive promotion' })
  @IsString()
  @IsOptional()
  description?: string;
}
```

### 3.2 — Binary / File Upload Field in DTO

```typescript
// ✅ PATTERN: type + format trick makes Swagger render a file-picker
@ApiProperty({ type: 'string', format: 'binary', required: false })
@IsOptional()
leftBannerFile?: any;  // ← type is 'any'; validation is not needed here
```

### 3.3 — Enum Field in DTO

```typescript
// ✅ PATTERN: Pass the enum directly; Swagger auto-renders a dropdown
@ApiPropertyOptional({ enum: Gender })
@IsOptional()
@IsEnum(Gender)
gender?: Gender;

// With example value from enum
@ApiPropertyOptional({ 
  enum: CampaignLifecycleStatus, 
  example: CampaignLifecycleStatus.PUBLISHED 
})
@IsOptional()
@IsEnum(CampaignLifecycleStatus)
campaignStatus?: CampaignLifecycleStatus;
```

### 3.4 — Array of MongoDB IDs

```typescript
@ApiProperty({
  description: 'List of Operating Area IDs',
  example: ['65f1a2b3c4d5e6f789001122', '65f1a2b3c4d5e6f789001133'],
  type: [String],
  required: true
})
@IsMongoId({ each: true })
@IsNotEmpty({ each: true })
operatingAreaIds: string[];
```

### 3.5 — Conditional Validation with `@ValidateIf`

```typescript
// ✅ PATTERN: Require reason ONLY when status is rejected
@ApiPropertyOptional({ example: 'DL image is unclear' })
@ValidateIf(o => o.dlApprovalStatus === ApprovalStatus.rejected)
@IsString()
@IsNotEmpty({ message: 'dlRejectReason is required when status is rejected' })
dlRejectReason?: string;
```

### 3.6 — Boolean Transform for `multipart/form-data`

```typescript
// ✅ PATTERN: form-data sends booleans as strings; Transform fixes this
@ApiPropertyOptional({ example: true })
@IsOptional()
@IsBoolean()
@Transform(({ value }) => typeof value === 'string' ? JSON.parse(value) : value)
driverActive?: boolean;
```

### 3.7 — Number Transform for Query DTOs

```typescript
// ✅ PATTERN: Query strings are always strings; @Type converts them
@ApiPropertyOptional({ example: 10 })
@IsOptional()
@Type(() => Number)
@IsNumber()
limit?: number = 10;
```

---

## 4. Controller Pattern

### 4.1 — Standard Response Envelope

Every controller method returns the **same shape** — no exceptions:

```typescript
return {
  success: true | false,          // boolean, based on result existence
  userMessage: '...',             // human-readable for UI toast
  developerMessage: '...',        // technical detail for devs/logs
  data: result | {},              // payload or empty object
};
```

> For **delete** operations: `data: {}` (always empty).
> For **errors**: thrown as NestJS HTTP exceptions — never returned as `success: false` in a 200.

### 4.2 — Guard Chaining (RBAC)

```typescript
// ✅ PATTERN: Always chain JwtAdminGuard BEFORE PermissionGuard
@UseGuards(JwtAdminGuard, PermissionGuard)
@Permission('driver:list')   // Custom metadata decorator
```

**RBAC Flow:**
```
Request → JwtAdminGuard (validates JWT, populates req.user) 
       → PermissionGuard (reads @Permission metadata via Reflector, checks req.user.permissions)
       → Handler
```

**PermissionGuard logic:**
```typescript
// SuperAdmin (roleType === 1) bypasses ALL permission checks
if (admin.roleType === 1) return true;
// Otherwise, check if ANY of the required permissions exist in the user's JWT
const hasPermission = requiredPermissions.some(p => permissions.includes(p));
```

### 4.3 — ObjectId Validation in Controller

```typescript
// ✅ PATTERN: Validate ObjectId in controller, throw BadRequestException immediately
if (!Types.ObjectId.isValid(driverId)) {
  throw new BadRequestException('Invalid driverId');
}
// Then call service — never let invalid IDs reach the DB
const result = await this.adminService.getDriverDetails(driverId);
```

### 4.4 — PATCH for Status vs PUT for Full Update

| Method | Use Case |
|---|---|
| `@Patch('/:id/status')` | Only changing status flag (e.g., `campaignStatus`, `driverActive`) |
| `@Put('/:id')` | Full resource replacement with all fields |
| `@Delete('/:id')` | Soft delete (never hard delete) |

---

## 5. Service Pattern

### 5.1 — try/catch Bubble Pattern

Every service method wraps in try/catch and **re-throws typed exceptions**:

```typescript
async getDriversList(queryParams: DriverListQueryDto) {
  try {
    // ... business logic
    return result;
  } catch (error) {
    // Re-throw known exceptions as-is
    if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
    // Wrap unknowns in BadRequestException
    throw new BadRequestException({
      userMessage: 'Error occurs',
      developerMessage: error?.message,
    });
  }
}
```

> **Rule:** Never let raw Mongoose/DB errors escape to the client.

### 5.2 — Private Helper Methods (`_prefix`)

Business logic sub-tasks are extracted into private methods prefixed with `_`:

```typescript
// In AdminService:
private async _generateTokens(admin: any, deviceId: string) { ... }
private async _sendNotification(notificationData: any) { ... }

// In CronService:
private _getYesterdayDateRange() { ... }
private _getRateAtTimestamp(campaigns, timestamp, rates) { ... }
private async _calculateDriverEarningForMonth(...) { ... }
private async _getRequiredPanelForCampaign(...) { ... }
private async _assignDriverToCampaign(...) { ... }
```

### 5.3 — Soft Delete Pattern

```typescript
// ✅ PATTERN: Never hard-delete. Set isDeleted + deletedAt
const deleted = await this.pricePackageModel.findOneAndUpdate(
  { _id: pricePackageId, isDeleted: false },   // ← Only delete if NOT already deleted
  { $set: { isDeleted: true, deletedAt: new Date() } },
  { new: true }
);
if (!deleted) throw new NotFoundException('Price package not found');
```

All list queries include `{ isDeleted: false }` or `{ isDeleted: { $ne: true } }` in the filter.

### 5.4 — Upsert Pattern (Create or Update)

```typescript
// ✅ PATTERN: findOneAndUpdate with upsert for session management
await this.adminLoggedTransModel.findOneAndUpdate(
  { adminId: admin._id, device_id: deviceId },
  updateDoc,
  { new: true, upsert: true, lean: true },  // ← Creates if doesn't exist
);
```

---

## 6. Performance Patterns

### 6.1 — `Promise.all` for Parallel DB Queries

```typescript
// ✅ PATTERN: Count + Find in parallel, not sequential
const [drivers, total] = await Promise.all([
  this.driverModel
    .find(filter)
    .sort(sortCondition)
    .skip(Number(skip))
    .limit(Number(limit))
    .lean(),                         // ← lean() = plain JS objects, no Mongoose overhead
  this.driverModel.countDocuments(filter),  // ← runs in parallel
]);
```

### 6.2 — `.lean()` Everywhere

```typescript
// ✅ ALWAYS use .lean() on read queries
// ❌ NEVER use .lean() if you need to call .save() after
.find(filter).lean()
.findOne({ _id }).lean()
```
`.lean()` returns plain objects instead of Mongoose Documents — ~2–3× faster for read-only operations.

### 6.3 — Field Projection with `.select()`

```typescript
// ✅ Exclude heavy/sensitive fields
.select('-password -__v -updatedAt')  // ← Exclude
.select('_id name language')          // ← Include only needed fields
// Also via .populate():
.populate('role', 'title shortName')  // ← Second arg = select projection
```

### 6.4 — Optional Pagination (Smart Paginate)

```typescript
// ✅ PATTERN: Paginate only if BOTH page AND limit are provided
const shouldPaginate = query.page && query.limit;

let mongooseQuery = this.pricePackageModel.find(filter).sort(sortCondition);

if (shouldPaginate) {
  const skip = (Number(query.page) - 1) * Number(query.limit);
  mongooseQuery = mongooseQuery.skip(skip).limit(Number(query.limit));
}

const [list, total] = await Promise.all([mongooseQuery.lean(), this.model.countDocuments(filter)]);

return {
  list,
  total,
  page: shouldPaginate ? Number(query.page) : 1,
  limit: shouldPaginate ? Number(query.limit) : total,
  totalPages: shouldPaginate ? Math.ceil(total / Number(query.limit)) : 1,
};
```

### 6.5 — Atomic Lock Pattern (Race Condition Prevention)

```typescript
// ✅ PATTERN: findOneAndUpdate as atomic lock — prevents double-assignment
const lockedDriver = await this.driverModel.findOneAndUpdate(
  {
    _id: driver._id,
    [panelField]: DriverCampaignStatus.INACTIVE  // ← Only locks if still available
  },
  { $set: { [panelField]: DriverCampaignStatus.ACTIVE } },
  { new: true }
);

if (!lockedDriver) return false; // ← Another process already locked it
```

### 6.6 — Global 15-Second Timeout Interceptor

```typescript
// In main.ts: app.useGlobalInterceptors(new TimeoutInterceptor());

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      timeout(15000),                   // ← Kill after 15 seconds
      catchError((err) => {
        if (err instanceof TimeoutError) {
          throw new RequestTimeoutException();   // ← 408 response
        }
        throw err;
      }),
    );
  }
}
```

### 6.7 — Azure Blob: Store Path, Sign on Read

```typescript
// ✅ PATTERN: NEVER store full URLs. Store only blob path.
// On WRITE:
const blobName = `campaigns/${id}/leftBannerFile/${Date.now()}-${filename}`;
await blockBlobClient.uploadData(file.buffer, { blobHTTPHeaders: { blobContentType: file.mimetype } });
// Store blobName in DB (not the full URL)

// On READ: Generate a time-limited SAS URL
const sasUrl = await this.azureBlobService.getSignedUrl(driver.profileImage);
// SAS expires in 6 days; 5-minute clock-skew buffer at start
```

### 6.8 — Search with Regex Sanitization

```typescript
// ✅ PATTERN: Escape special regex chars before using in $regex
const searchRegex = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

filter.$or = [
  { name: { $regex: searchRegex, $options: 'i' } },
  { phoneNumber: { $regex: searchRegex, $options: 'i' } },
  { email: { $regex: searchRegex, $options: 'i' } },
];
```

---

## 7. Load Reduction Strategies

| Strategy | Where Applied | Impact |
|---|---|---|
| **`.lean()`** | All read queries | Removes Mongoose Document overhead; faster serialization |
| **`.select()`** | All queries | Reduces wire size; excludes password, `__v`, `updatedAt` |
| **`Promise.all`** | Count + Find | Halves latency of paginated list queries |
| **Optional pagination** | Price package, users | Avoids forced skip+limit when not needed |
| **Soft delete** | All resources | No cascade deletes; data preserved for audits |
| **Upsert sessions** | Login/token regenerate | No separate INSERT + UPDATE round-trips |
| **Atomic lock** | Auto-assign drivers | Prevents double-booking without transactions |
| **15s timeout** | Global interceptor | Frees up Node event loop from hanging DB queries |
| **SAS URL signing** | Azure Blob reads | No public storage exposure; URLs time-limited to 6 days |
| **Daily map aggregation** | Cron earning calc | Calculates earnings in-memory, one DB write per driver per run |
| **`updateMany` in cron** | Campaign completion | Batch-updates thousands of records in a single query |
| **`countDocuments` over `count()`** | All paginated lists | `countDocuments` respects filter indexes |

---

## 7.5 — Common Infrastructure (Every Project)

### 7.5.1 — Common Query DTO (`src/common/dto/queryParams.dto.ts`)

```typescript
// ✅ PATTERN: Every list API extends this common pagination DTO.
// If an API needs extra query params, simply extend and add more fields.
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsPositive, IsString } from 'class-validator';

export class QueryParamsDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number' })
  @IsInt() @Type(() => Number) @IsPositive() @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 10, description: 'Items per page' })
  @IsInt() @Type(() => Number) @IsPositive() @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ example: 'createdAt' })
  @IsOptional() @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ example: 'desc', enum: ['asc', 'desc'] })
  @IsOptional() @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ example: 'text' })
  @IsString() @IsOptional()
  search?: string;
}

// Usage in any list DTO:
export class ProjectListQueryDto extends QueryParamsDto {
  @ApiPropertyOptional({ example: '66b8f1a2c4d5e6f789001199', required: true })
  @IsMongoId() @IsNotEmpty()
  workspaceId: string;
}
```

### 7.5.2 — Entity Schema Pattern (`src/entities/*.entity.ts`)

```typescript
// ✅ PATTERN: `@Schema({ timestamps: true })` handles createdAt/updatedAt.
// ❌ NEVER declare `createdAt`, `updatedAt`, or `_id` manually — timestamps:true adds them.
// ❌ NEVER export a `XxxDocument` type — extend Document directly.
// ✅ Export a `XxxCollectionName` used in app.module.forFeature and @InjectModel.

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true }, id: false })
export class DriverEntity extends Document {
  @Prop({ required: true, index: true, trim: true })
  phoneNumber: string;

  @Prop({ type: Types.ObjectId, ref: PreferredCityEntity.name, required: false, index: true })
  preferredCity: Types.ObjectId;

  // Enum fields use the enum type directly
  @Prop({ required: false, enum: Gender })
  gender?: Gender;

  @Prop({ required: false, default: false })
  isDeleted: boolean;
}

export const DriverCollectionName = 'drivers';
export const DriverSchema = SchemaFactory.createForClass(DriverEntity);
```

### 7.5.3 — Request/Response Logger Entity (`src/common/entities/logger.entity.ts`)

```typescript
// ✅ PATTERN: Every request/response is logged to a `loggers` collection
// with a 2-day TTL index (expireAfterSeconds) so logs auto-clean.
@Schema({ timestamps: true })
export class LoggerEntity {
  @Prop({ required: true }) requestMethod: string;
  @Prop({ required: true }) requestUrl: string;
  @Prop({ required: false, type: Object, default: null }) requestHeaders: Record<string, any>;
  @Prop({ required: false, type: Object, default: null }) requestBody: Record<string, any>;
  @Prop({ required: false }) statusCode: number;
  @Prop({ required: false, type: Object }) responseBody: Record<string, any>;
  @Prop({ required: false, type: SchemaTypes.Date }) startTime: Date;
  @Prop({ required: false, type: SchemaTypes.Date }) endTime: Date;
  @Prop({ required: false }) executionTime: number;
  @Prop({ required: false, default: '' }) error: string;
}
export const LoggerCollectionName = 'loggers';
export const LoggerSchema = SchemaFactory.createForClass(LoggerEntity);
LoggerSchema.index({ createdAt: 1 }, { expireAfterSeconds: 172800 }); // auto-delete after 2 days
```

### 7.5.4 — Global Response Interceptor (`src/common/interceptors/response.interceptor.ts`)

```typescript
// ✅ PATTERN: Registered once in app.module via APP_INTERCEPTOR.
// Wraps every controller response + writes the request/response to LoggerEntity.

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(@InjectModel(LoggerEntity.name) private readonly loggerModel: Model<LoggerEntity>) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(async (responseData) => {
        const [req, res] = context.getArgs();
        const startTime = +req._startTime;
        const endTime = +new Date();
        const reqTime = endTime - startTime;
        res.statusCode = responseData?.statusCode || HttpStatus.OK;

        const formattedResponse = {
          statusCode: res.statusCode,
          success: responseData.success === false ? false : true,
          userMessage: responseData?.userMessage ?? '',
          developerMessage: responseData?.developerMessage ?? '',
          data: responseData.data || {},
        };

        const logDoc = await this.loggerModel.create({ requestMethod: req.method, requestUrl: req.url, ... });
        return { logId: logDoc._id, ...formattedResponse };
      }),
    );
  }
}
```

### 7.5.5 — Global Exception Filter (`src/common/filters/all-exception.filter.ts`)

```typescript
// ✅ PATTERN: Registered once in app.module via APP_FILTER.
// Normalizes ALL errors (HttpException + unknown 500) into a consistent shape
// and logs them to LoggerEntity. Never return `success: false` inside a 200.

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @InjectModel(LoggerEntity.name) private readonly loggerModel: Model<LoggerEntity>,
    private readonly httpAdapterHost: HttpAdapterHost,
  ) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const statusCode = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    // ... build formattedResponse: { statusCode, success:false, userMessage, developerMessage, data:{} }
    // ... write logDoc to loggerModel
    httpAdapter.reply(ctx.getResponse(), { logId: logDoc?._id, ...formattedResponse }, statusCode);
  }
}
```

### 7.5.6 — Guard Pattern (`src/common/guards/jwt.guard.ts`)

```typescript
// ✅ PATTERN: Every protected route uses @UseGuards(JwtGuard).
// Supports @Public() decorator for routes that should skip auth.

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }
  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.get<boolean>('isPublic', context.getHandler());
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
```

### 7.5.7 — App Module Registration Pattern

```typescript
// ✅ PATTERN: Register LoggerEntity + ResponseInterceptor + AllExceptionsFilter
// as GLOBAL providers so every request inherits logging + envelope.

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LoggerEntity.name, schema: LoggerSchema, collection: LoggerCollectionName },
      { name: UserEntity.name, schema: UserSchema, collection: UserCollectionName },
      // ... other entities with their CollectionName
    ]),
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    // ... services & strategies
  ],
})
export class AppModule {}
```

---

## 8. Ready-to-Use Scaffold Templates

### 8.1 — Controller Scaffold

```typescript
import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { JwtAdminGuard } from 'src/common/guards/jwt-admin.guard';
import { PermissionGuard } from 'src/common/guards/permission.guard';
import { Permission } from 'src/common/decorators/permission.decorator';
import { FeatureService } from '../services/feature.service';
import { CreateFeatureDto } from '../dto/create-feature.dto';
import { FeatureListQueryDto } from '../dto/feature-list-query.dto';

@ApiTags('Feature')
@Controller('feature')
export class FeatureController {
  constructor(private readonly featureService: FeatureService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAdminGuard, PermissionGuard)
  @Permission('feature:list')
  async getAll(@Query() query: FeatureListQueryDto) {
    const result = await this.featureService.getAll(query);
    return { success: true, userMessage: 'List fetched successfully', developerMessage: 'List fetched', data: result };
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAdminGuard, PermissionGuard)
  @Permission('feature:list')
  @ApiParam({ name: 'id', description: 'Feature ID', type: 'string', format: 'mongodb ObjectId' })
  async getOne(@Param('id') id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid ID');
    const result = await this.featureService.getOne(id);
    return { success: true, userMessage: 'Detail fetched', developerMessage: 'Detail fetched', data: result };
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAdminGuard, PermissionGuard)
  @Permission('feature:add')
  async create(@Body() body: CreateFeatureDto) {
    const result = await this.featureService.create(body);
    return { success: true, userMessage: 'Created successfully', developerMessage: 'Created', data: result };
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAdminGuard, PermissionGuard)
  @Permission('feature:edit')
  @ApiParam({ name: 'id', description: 'Feature ID' })
  async update(@Param('id') id: string, @Body() body: CreateFeatureDto) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid ID');
    const result = await this.featureService.update(id, body);
    return { success: true, userMessage: 'Updated successfully', developerMessage: 'Updated', data: result };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAdminGuard, PermissionGuard)
  @Permission('feature:delete')
  @ApiParam({ name: 'id', description: 'Feature ID' })
  async remove(@Param('id') id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid ID');
    await this.featureService.remove(id);
    return { success: true, userMessage: 'Deleted successfully', developerMessage: 'Deleted', data: {} };
  }
}
```

### 8.2 — Service Scaffold

```typescript
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FeatureEntity } from '../entities/feature.entity';
import { CreateFeatureDto } from '../dto/create-feature.dto';
import { FeatureListQueryDto } from '../dto/feature-list-query.dto';

@Injectable()
export class FeatureService {
  constructor(
    @InjectModel(FeatureEntity.name) private readonly featureModel: Model<FeatureEntity>,
  ) {}

  async getAll(query: FeatureListQueryDto) {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search } = query;
      const skip = (Number(page) - 1) * Number(limit);

      const filter: any = { isDeleted: false };

      if (search) {
        const searchRegex = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filter.$or = [{ name: { $regex: searchRegex, $options: 'i' } }];
      }

      const sortCondition: any = {};
      sortCondition[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const [list, total] = await Promise.all([
        this.featureModel.find(filter).sort(sortCondition).skip(skip).limit(Number(limit)).select('-__v').lean(),
        this.featureModel.countDocuments(filter),
      ]);

      return { list, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
    } catch (error) {
      throw new BadRequestException({ userMessage: 'Error fetching list', developerMessage: error?.message });
    }
  }

  async getOne(id: string) {
    try {
      const item = await this.featureModel.findOne({ _id: id, isDeleted: false }).select('-__v').lean();
      if (!item) throw new NotFoundException('Not found');
      return item;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException({ userMessage: 'Error fetching detail', developerMessage: error?.message });
    }
  }

  async create(dto: CreateFeatureDto) {
    try {
      const exists = await this.featureModel.exists({ name: dto.name, isDeleted: false });
      if (exists) throw new ConflictException('Name already exists');
      const created = await this.featureModel.create(dto);
      return created;
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      if (error.code === 11000) throw new ConflictException('Duplicate entry');
      throw new BadRequestException({ userMessage: 'Error creating', developerMessage: error?.message });
    }
  }

  async update(id: string, dto: CreateFeatureDto) {
    try {
      const updated = await this.featureModel.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: dto },
        { new: true, runValidators: true },
      );
      if (!updated) throw new NotFoundException('Not found');
      return updated;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException({ userMessage: 'Error updating', developerMessage: error?.message });
    }
  }

  async remove(id: string) {
    try {
      const deleted = await this.featureModel.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: { isDeleted: true, deletedAt: new Date() } },
        { new: true },
      );
      if (!deleted) throw new NotFoundException('Not found');
      return true;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException({ userMessage: 'Error deleting', developerMessage: error?.message });
    }
  }
}
```

### 8.3 — Query DTO Scaffold (with Swagger)

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator';

export class FeatureListQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;

  @ApiPropertyOptional({ example: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ example: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ example: 'search term' })
  @IsOptional()
  @IsString()
  search?: string;
}
```

---

## 9. Architecture Diagram

```
HTTP Request
     │
     ▼
[ValidationPipe]       ← Transform query strings / body; validate with class-validator
     │
     ▼
[TimeoutInterceptor]   ← Kill if > 15s
     │
     ▼
[JwtAdminGuard]        ← Verify JWT, populate req.user (adminId, permissions, roleType)
     │
     ▼
[PermissionGuard]      ← Read @Permission() metadata; check req.user.permissions
     │                   (SuperAdmin roleType=1 bypasses)
     ▼
[Controller Method]    ← Validate ObjectId; delegate to service; wrap in response envelope
     │
     ▼
[Service Method]       ← try/catch; business logic; Promise.all; lean(); select()
     │
     ▼
[Mongoose / Azure]     ← DB operations or Blob Storage
     │
     ▼
[Response Envelope]    ← { success, userMessage, developerMessage, data }
```
