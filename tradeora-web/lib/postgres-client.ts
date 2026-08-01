import pool from './db';

class PostgresQueryBuilder<T = any> implements PromiseLike<{ data: T[] | T | null; error: any }> {
  private tableName: string;
  private actionType: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private selectColumns: string = '*';
  private whereConditions: Array<{ col: string; op: string; val: any }> = [];
  private payload: any = null;
  private orderClause: string | null = null;
  private limitNumber: number | null = null;
  private expectSingle: boolean = false;
  private expectMaybeSingle: boolean = false;
  private upsertConflict: string | null = null;

  constructor(table: string) {
    this.tableName = table;
  }

  select(columns: string = '*') {
    this.selectColumns = columns;
    return this;
  }

  insert(data: any | any[]) {
    this.actionType = 'insert';
    this.payload = Array.isArray(data) ? data : [data];
    return this;
  }

  upsert(data: any | any[], options?: { onConflict?: string }) {
    this.actionType = 'upsert';
    this.payload = Array.isArray(data) ? data : [data];
    if (options?.onConflict) {
      this.upsertConflict = options.onConflict;
    }
    return this;
  }

  update(data: any) {
    this.actionType = 'update';
    this.payload = data;
    return this;
  }

  delete() {
    this.actionType = 'delete';
    return this;
  }

  eq(col: string, val: any) {
    this.whereConditions.push({ col, op: '=', val });
    return this;
  }

  neq(col: string, val: any) {
    this.whereConditions.push({ col, op: '!=', val });
    return this;
  }

  gt(col: string, val: any) {
    this.whereConditions.push({ col, op: '>', val });
    return this;
  }

  gte(col: string, val: any) {
    this.whereConditions.push({ col, op: '>=', val });
    return this;
  }

  lt(col: string, val: any) {
    this.whereConditions.push({ col, op: '<', val });
    return this;
  }

  lte(col: string, val: any) {
    this.whereConditions.push({ col, op: '<=', val });
    return this;
  }

  in(col: string, vals: any[]) {
    this.whereConditions.push({ col, op: 'IN', val: vals });
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    const dir = opts?.ascending === false ? 'DESC' : 'ASC';
    this.orderClause = `"${col}" ${dir}`;
    return this;
  }

  limit(n: number) {
    this.limitNumber = n;
    return this;
  }

  single() {
    this.expectSingle = true;
    return this;
  }

  maybeSingle() {
    this.expectMaybeSingle = true;
    return this;
  }

  async then<TResult1 = { data: any; error: any }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    try {
      const result = await this.execute();
      if (onfulfilled) return onfulfilled(result);
      return result as any;
    } catch (err) {
      if (onrejected) return onrejected(err);
      throw err;
    }
  }

  private async execute(): Promise<{ data: any; error: any }> {
    let sql = '';
    const values: any[] = [];
    let paramIdx = 1;

    const buildWhere = () => {
      if (this.whereConditions.length === 0) return '';
      const clauses: string[] = [];
      for (const cond of this.whereConditions) {
        if (cond.op === 'IN') {
          if (!Array.isArray(cond.val) || cond.val.length === 0) {
            clauses.push('1 = 0');
          } else {
            const placeholders = cond.val.map((v: any) => {
              values.push(v);
              return `$${paramIdx++}`;
            }).join(', ');
            clauses.push(`"${cond.col}" IN (${placeholders})`);
          }
        } else {
          values.push(cond.val);
          clauses.push(`"${cond.col}" ${cond.op} $${paramIdx++}`);
        }
      }
      return ' WHERE ' + clauses.join(' AND ');
    };

    if (this.actionType === 'select') {
      sql = `SELECT ${this.selectColumns === '*' ? '*' : this.selectColumns} FROM "${this.tableName}"`;
      sql += buildWhere();
      if (this.orderClause) {
        sql += ` ORDER BY ${this.orderClause}`;
      }
      if (this.limitNumber !== null) {
        sql += ` LIMIT ${this.limitNumber}`;
      }
    } else if (this.actionType === 'insert') {
      if (!this.payload || this.payload.length === 0) {
        return { data: [], error: null };
      }
      const keys = Object.keys(this.payload[0]);
      const cols = keys.map(k => `"${k}"`).join(', ');
      const rowPlaceholders: string[] = [];
      for (const row of this.payload) {
        const itemPlaceholders: string[] = [];
        for (const k of keys) {
          values.push(row[k]);
          itemPlaceholders.push(`$${paramIdx++}`);
        }
        rowPlaceholders.push(`(${itemPlaceholders.join(', ')})`);
      }
      sql = `INSERT INTO "${this.tableName}" (${cols}) VALUES ${rowPlaceholders.join(', ')} RETURNING *`;
    } else if (this.actionType === 'upsert') {
      if (!this.payload || this.payload.length === 0) {
        return { data: [], error: null };
      }
      const keys = Object.keys(this.payload[0]);
      const cols = keys.map(k => `"${k}"`).join(', ');
      const rowPlaceholders: string[] = [];
      for (const row of this.payload) {
        const itemPlaceholders: string[] = [];
        for (const k of keys) {
          values.push(row[k]);
          itemPlaceholders.push(`$${paramIdx++}`);
        }
        rowPlaceholders.push(`(${itemPlaceholders.join(', ')})`);
      }
      
      let conflictTarget = '';
      if (this.upsertConflict) {
        conflictTarget = `(${this.upsertConflict.split(',').map(c => `"${c.trim()}"`).join(', ')})`;
      } else if (keys.includes('id')) {
        conflictTarget = `("id")`;
      }
      
      const updateSet = keys.map(k => `"${k}" = EXCLUDED."${k}"`).join(', ');
      sql = `INSERT INTO "${this.tableName}" (${cols}) VALUES ${rowPlaceholders.join(', ')}`;
      if (conflictTarget) {
        sql += ` ON CONFLICT ${conflictTarget} DO UPDATE SET ${updateSet}`;
      } else {
        sql += ` ON CONFLICT DO NOTHING`;
      }
      sql += ` RETURNING *`;
    } else if (this.actionType === 'update') {
      const keys = Object.keys(this.payload);
      const setClauses = keys.map(k => {
        values.push(this.payload[k]);
        return `"${k}" = $${paramIdx++}`;
      }).join(', ');
      sql = `UPDATE "${this.tableName}" SET ${setClauses}` + buildWhere() + ` RETURNING *`;
    } else if (this.actionType === 'delete') {
      sql = `DELETE FROM "${this.tableName}"` + buildWhere() + ` RETURNING *`;
    }

    try {
      const dbRes = await pool.query(sql, values);
      let data = dbRes.rows;

      if (this.expectSingle) {
        if (data.length === 0) {
          return { data: null, error: { message: 'Row not found', code: 'PGRST116' } };
        }
        return { data: data[0], error: null };
      }

      if (this.expectMaybeSingle) {
        return { data: data.length > 0 ? data[0] : null, error: null };
      }

      return { data, error: null };
    } catch (err: any) {
      console.error(`PostgresQueryBuilder error on ${this.tableName}:`, err.message);
      return { data: null, error: { message: err.message } };
    }
  }
}

export function fromTable(tableName: string) {
  return new PostgresQueryBuilder(tableName);
}
