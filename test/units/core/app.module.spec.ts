// Mock TypeOrmModule.forFeature to avoid creating repositories during test import
jest.mock('@nestjs/typeorm', () => {
  const actual = jest.requireActual('@nestjs/typeorm');
  return {
    ...actual,
    TypeOrmModule: {
      ...actual.TypeOrmModule,
      // preserve forRootAsync and other functions, only override forFeature
      forFeature: () => ({ provide: 'TYPEORM_MOCK' }),
      forRootAsync: actual.TypeOrmModule.forRootAsync,
      forRoot: actual.TypeOrmModule.forRoot,
    },
  };
});

import { AppModule } from './../../../src/app.module';

/**
 * Test suite for AppModule.
 */
describe('AppModule', () => {
  it('should be defined', () => {
    expect(AppModule).toBeDefined();
  });
});
