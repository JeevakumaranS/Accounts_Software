import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get('categories')
  @ApiOperation({ summary: 'List expense categories' })
  getCategories() {
    return this.expensesService.getCategories();
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create expense category' })
  createCategory(@Body() data: any) {
    return this.expensesService.createCategory(data);
  }

  @Get()
  @ApiOperation({ summary: 'List all expenses' })
  findAll() {
    return this.expensesService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Record and post expense' })
  create(@Body() dto: any, @CurrentUser() user: any) {
    return this.expensesService.createExpense(dto, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get expense details' })
  findOne(@Param('id') id: string) {
    return this.expensesService.findById(id);
  }
}
