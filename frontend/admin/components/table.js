class DataTable {
    constructor(options = {}) {
        this.data = options.data || [];
        this.columns = options.columns || [];
        this.currentPage = 1;
        this.pageSize = options.pageSize || 10;
        this.filteredData = this.data;
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.selectedRows = new Set();
        this.onRowAction = options.onRowAction || null;
        this.onBulkAction = options.onBulkAction || null;
        this.bulkActions = options.bulkActions || [];
    }

    setData(data) {
        this.data = data;
        this.filteredData = [...data];
        this.currentPage = 1;
        this.selectedRows.clear();
    }

    filter(searchTerm) {
        const term = searchTerm.toLowerCase();
        this.filteredData = this.data.filter(row =>
            Object.values(row).some(val =>
                String(val).toLowerCase().includes(term)
            )
        );
        this.currentPage = 1;
        this.selectedRows.clear();
    }

    sort(columnKey) {
        if (this.sortColumn === columnKey) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = columnKey;
            this.sortDirection = 'asc';
        }

        this.filteredData.sort((a, b) => {
            let aVal = a[columnKey];
            let bVal = b[columnKey];

            // Handle nested properties
            if (typeof columnKey === 'string' && columnKey.includes('.')) {
                const keys = columnKey.split('.');
                aVal = keys.reduce((obj, key) => obj?.[key], a);
                bVal = keys.reduce((obj, key) => obj?.[key], b);
            }

            // Numeric comparison
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return this.sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
            }

            // Date comparison
            if (aVal instanceof Date && bVal instanceof Date) {
                return this.sortDirection === 'asc'
                    ? aVal.getTime() - bVal.getTime()
                    : bVal.getTime() - aVal.getTime();
            }

            // String comparison
            aVal = String(aVal).toLowerCase();
            bVal = String(bVal).toLowerCase();
            if (this.sortDirection === 'asc') {
                return aVal.localeCompare(bVal);
            } else {
                return bVal.localeCompare(aVal);
            }
        });
    }

    getPaginatedData() {
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        return this.filteredData.slice(start, end);
    }

    getTotalPages() {
        return Math.ceil(this.filteredData.length / this.pageSize);
    }

    goToPage(page) {
        const totalPages = this.getTotalPages();
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
        }
    }

    toggleRowSelection(rowIndex) {
        if (this.selectedRows.has(rowIndex)) {
            this.selectedRows.delete(rowIndex);
        } else {
            this.selectedRows.add(rowIndex);
        }
    }

    toggleSelectAll(isChecked) {
        this.selectedRows.clear();
        if (isChecked) {
            const pageData = this.getPaginatedData();
            pageData.forEach((_, index) => {
                this.selectedRows.add(index);
            });
        }
    }

    getSelectedRows() {
        const pageData = this.getPaginatedData();
        return Array.from(this.selectedRows).map(index => pageData[index]);
    }

    render(container) {
        const pageData = this.getPaginatedData();
        const totalPages = this.getTotalPages();
        const hasBulkActions = this.bulkActions.length > 0;

        let html = '<div class="table-wrapper">';
        html += '<table>';

        // Header
        html += '<thead><tr>';
        if (hasBulkActions) {
            const allSelected = this.selectedRows.size === pageData.length && pageData.length > 0;
            html += `<th style="width: 50px;"><input type="checkbox" class="checkbox table-select-all" ${allSelected ? 'checked' : ''}></th>`;
        }
        this.columns.forEach(col => {
            const isSortable = !col.sortDisabled;
            const sorted = this.sortColumn === col.key;
            const sortClass = sorted ? (this.sortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc') : '';
            const sortableClass = isSortable ? 'sortable' : '';
            html += `<th class="${sortableClass} ${sortClass}" data-column="${col.key}" style="width: ${col.width || 'auto'};">${col.label}</th>`;
        });
        html += '</tr></thead>';

        // Body
        html += '<tbody>';
        if (pageData.length === 0) {
            html += `<tr><td colspan="${this.columns.length + (hasBulkActions ? 1 : 0)}" class="empty-state"><p>No data found</p></td></tr>`;
        } else {
            pageData.forEach((row, index) => {
                const isSelected = this.selectedRows.has(index);
                html += `<tr class="${isSelected ? 'selected' : ''}">`;

                if (hasBulkActions) {
                    html += `<td><input type="checkbox" class="checkbox table-row-checkbox" data-index="${index}" ${isSelected ? 'checked' : ''}></td>`;
                }

                this.columns.forEach(col => {
                    const value = this.getCellValue(row, col);
                    html += `<td>${value}</td>`;
                });

                html += '</tr>';
            });
        }
        html += '</tbody>';

        html += '</table>';
        html += '</div>';

        // Pagination
        if (totalPages > 1) {
            html += `<div class="pagination">`;
            html += `<button class="pagination-item ${this.currentPage === 1 ? 'disabled' : ''}" data-page="prev">&lt;</button>`;

            for (let i = 1; i <= totalPages; i++) {
                if (i === 1 || i === totalPages || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) {
                    html += `<button class="pagination-item ${i === this.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
                } else if (i === 2 || i === totalPages - 1) {
                    html += `<span class="pagination-item disabled">...</span>`;
                }
            }

            html += `<button class="pagination-item ${this.currentPage === totalPages ? 'disabled' : ''}" data-page="next">&gt;</button>`;
            html += `<span class="pagination-info">Page ${this.currentPage} of ${totalPages}</span>`;
            html += `</div>`;
        }

        // Bulk actions bar
        if (hasBulkActions && this.selectedRows.size > 0) {
            html = `<div style="margin-bottom: 1rem; padding: 1rem; background: rgba(108, 99, 255, 0.05); border: 1px solid rgba(108, 99, 255, 0.2); border-radius: 9px; display: flex; align-items: center; justify-content: space-between;">
                <span>${this.selectedRows.size} selected</span>
                <div style="display: flex; gap: 0.5rem;">
                    ${this.bulkActions.map(action => `<button class="btn btn-sm btn-${action.style || 'secondary'}" data-bulk-action="${action.key}">${action.label}</button>`).join('')}
                </div>
            </div>` + html;
        }

        container.innerHTML = html;

        // Attach event listeners
        this.attachEventListeners(container);
    }

    getCellValue(row, col) {
        if (col.render) {
            return col.render(row, col);
        }

        let value = row[col.key];

        if (typeof value === 'object' && value !== null) {
            if (value instanceof Date) {
                return value.toLocaleString();
            }
            return JSON.stringify(value);
        }

        return value || '';
    }

    attachEventListeners(container) {
        // Sort
        container.querySelectorAll('th.sortable').forEach(th => {
            th.addEventListener('click', () => {
                const column = th.dataset.column;
                this.sort(column);
                this.render(container);
            });
        });

        // Pagination
        container.querySelectorAll('.pagination-item[data-page]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = e.target.dataset.page;
                if (page === 'prev') {
                    this.goToPage(this.currentPage - 1);
                } else if (page === 'next') {
                    this.goToPage(this.currentPage + 1);
                } else {
                    this.goToPage(parseInt(page));
                }
                this.render(container);
            });
        });

        // Checkbox - select all
        const selectAllCheckbox = container.querySelector('.table-select-all');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                this.toggleSelectAll(e.target.checked);
                this.render(container);
            });
        }

        // Checkbox - individual row
        container.querySelectorAll('.table-row-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.toggleRowSelection(index);
                this.render(container);
            });
        });

        // Row actions
        container.querySelectorAll('[data-row-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.closest('[data-row-action]').dataset.rowAction;
                const rowId = e.target.closest('[data-row-action]').dataset.rowId;
                if (this.onRowAction) {
                    this.onRowAction(action, rowId);
                }
            });
        });

        // Bulk actions
        container.querySelectorAll('[data-bulk-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.bulkAction;
                const selectedRows = this.getSelectedRows();
                if (this.onBulkAction) {
                    this.onBulkAction(action, selectedRows);
                }
            });
        });
    }
}
