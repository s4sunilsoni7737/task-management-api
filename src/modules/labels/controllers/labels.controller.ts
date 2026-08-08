import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { LabelsService } from '../services/labels.service';
import { CreateLabelDto } from '../dto/create-label.dto';
import { UpdateLabelDto } from '../dto/update-label.dto';
import { LabelListQueryDto } from '../dto/label-list-query.dto';

@ApiTags('Labels')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('labels')
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  @Get()
  async getAll(@Query() query: LabelListQueryDto, @CurrentUser('userId') userId: string) {
    const result = await this.labelsService.getAll(query.workspaceId, userId);
    return {
      success: true,
      userMessage: 'Labels fetched successfully',
      developerMessage: 'Label list fetched',
      data: result,
    };
  }

  @Post()
  async create(@Body() body: CreateLabelDto, @CurrentUser('userId') userId: string) {
    const result = await this.labelsService.create(body, userId);
    return {
      success: true,
      userMessage: 'Label created successfully',
      developerMessage: 'Label created',
      data: result,
    };
  }

  @Patch(':id')
  @ApiParam({ name: 'id', description: 'Label ID', type: 'string', format: 'mongodb ObjectId' })
  async update(@Param('id') id: string, @Body() body: UpdateLabelDto) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid label id');
    const result = await this.labelsService.update(id, body);
    return {
      success: true,
      userMessage: 'Label updated successfully',
      developerMessage: 'Label updated',
      data: result,
    };
  }

  @Delete(':id')
  @ApiParam({ name: 'id', description: 'Label ID', type: 'string', format: 'mongodb ObjectId' })
  async remove(@Param('id') id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid label id');
    await this.labelsService.remove(id);
    return {
      success: true,
      userMessage: 'Label deleted successfully',
      developerMessage: 'Label soft-deleted',
      data: {},
    };
  }
}
