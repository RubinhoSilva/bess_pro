import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from './button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { cn } from '@/lib/utils';
import type { 
  PaginatedResponse, 
  OffsetPaginationRequest,
  PaginationRequest 
} from '@/types/pagination';

interface DataPaginationProps<T = any> {
  data: any; // Usando any para flexibilidade com diferentes formatos
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  className?: string;
  showPageSize?: boolean;
  pageSizeOptions?: number[];
  type?: 'offset' | 'cursor';
}

export function DataPagination<T>({
  data,
  onPageChange,
  onLimitChange,
  className,
  showPageSize = true,
  pageSizeOptions = [10, 20, 50, 100],
  type = 'offset'
}: DataPaginationProps<T>) {
  const { pagination } = data;

  if (type === 'cursor') {
    return (
      <div className={cn("flex items-center justify-between px-2", className)}>
        <div className="flex-1 text-sm text-muted-foreground">
          Mostrando {data.data.length} de {pagination.totalCount || 'muitos'} resultados
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          {showPageSize && onLimitChange && (
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Itens por página</p>
              <Select
                value={pagination.limit?.toString()}
                onValueChange={(value) => onLimitChange(parseInt(value))}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={pagination.limit?.toString()} />
                </SelectTrigger>
                <SelectContent side="top">
                  {pageSizeOptions.map((pageSize) => (
                    <SelectItem key={pageSize} value={pageSize.toString()}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(-1)}
              disabled={!pagination.hasPreviousPage}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Página anterior</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={!pagination.hasNextPage}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Próxima página</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Offset pagination 
  const currentPage = (pagination as any).page || 1;
  const totalPages = Math.ceil((pagination.totalCount || 0) / (pagination.limit || 20));

  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); 
         i <= Math.min(totalPages - 1, currentPage + delta); 
         i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  return (
    <div className={cn("flex items-center justify-between px-2", className)}>
      <div className="flex-1 text-sm text-muted-foreground">
        Mostrando {((currentPage - 1) * (pagination.limit || 20)) + 1} até{' '}
        {Math.min(currentPage * (pagination.limit || 20), pagination.totalCount || 0)} de{' '}
        {pagination.totalCount || 0} resultados
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        {showPageSize && onLimitChange && (
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Itens por página</p>
            <Select
              value={pagination.limit?.toString()}
              onValueChange={(value) => onLimitChange(parseInt(value))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pagination.limit?.toString()} />
              </SelectTrigger>
              <SelectContent side="top">
                {pageSizeOptions.map((pageSize) => (
                  <SelectItem key={pageSize} value={pageSize.toString()}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Página {currentPage} de {totalPages}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
          >
            <span className="sr-only">Primeira página</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <span className="sr-only">Página anterior</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          {getPageNumbers().map((pageNumber, index) => (
            <React.Fragment key={index}>
              {pageNumber === '...' ? (
                <span className="flex h-8 w-8 items-center justify-center text-sm">
                  ...
                </span>
              ) : (
                <Button
                  variant={currentPage === pageNumber ? "default" : "outline"}
                  className="h-8 w-8 p-0"
                  onClick={() => onPageChange(pageNumber as number)}
                >
                  {pageNumber}
                </Button>
              )}
            </React.Fragment>
          ))}
          
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <span className="sr-only">Próxima página</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            <span className="sr-only">Última página</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface InfinitePaginationProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  className?: string;
}

export function InfinitePagination({
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  className
}: InfinitePaginationProps) {
  return (
    <div className={cn("flex justify-center py-4", className)}>
      <Button
        variant="outline"
        onClick={onLoadMore}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage ? "Carregando..." : hasNextPage ? "Carregar mais" : "Nada mais para carregar"}
      </Button>
    </div>
  );
}