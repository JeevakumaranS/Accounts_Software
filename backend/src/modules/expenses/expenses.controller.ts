import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get('categories')
  getCategories() {
    return this.expensesService.getCategories();
  }

  @Post('categories')
  createCategory(@Body() data: any) {
    return this.expensesService.createCategory(data);
  }

  @Get()
  findAll() {
    return this.expensesService.findAll();
  }

  @Post()
  create(@Body() dto: any, @CurrentUser() user: any) {
    return this.expensesService.createExpense(dto, user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.expensesService.findById(id);
  }
}
