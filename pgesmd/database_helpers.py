import heapq


def insert_into_year(self, start, year_start, prev_date, year_sum, year_cnt,
                     S_ONE_WEEK):
    middle = start - 26 * S_ONE_WEEK
    year_avg = int(round(year_sum / year_cnt))
    self.cursor.execute("""
        INSERT INTO year (
            start,
            middle,
            end,
            date,
            year_avg,
            year_sum)
        VALUES (?,?,?,?,?,?);""", (
            year_start,
            middle,
            start,
            prev_date,
            year_avg,
            year_sum))


def insert_into_month(self, start, month_start, prev_date, month_sum,
                      month_cnt, ONE_MONTH, cur_datetime):
    middle = int((cur_datetime + ONE_MONTH / 2).timestamp())
    month_avg = int(round(month_sum / month_cnt))
    self.cursor.execute("""
        INSERT INTO month (
            start,
            middle,
            end,
            date,
            month_avg,
            month_sum)
        VALUES (?,?,?,?,?,?);""", (
            month_start,
            middle,
            start,
            prev_date,
            month_avg,
            month_sum))


def insert_into_week(self, start, week_start, prev_date, week_sum,
                     week_cnt, S_ONE_WEEK):
    week_avg = int(round(week_sum / week_cnt))
    self.cursor.execute("""
        INSERT INTO week (
            start,
            middle,
            end,
            date,
            week_avg,
            week_sum)
        VALUES (?,?,?,?,?,?);""", (
            week_start,
            week_start + S_ONE_WEEK / 2,
            start,
            prev_date,
            week_avg,
            week_sum))


def insert_into_day(self, start, day_start, prev_date, day_sum, day_cnt,
                    S_ONE_DAY, min_heap):
    daily_min = heapq.nsmallest(1, min_heap)[0]
    day_avg = int(round(day_sum / day_cnt))
    self.cursor.execute("""
        INSERT INTO day (
            start,
            middle,
            end,
            date,
            day_avg,
            day_sum,
            min)
        VALUES (?,?,?,?,?,?,?);""", (
            day_start,
            day_start + S_ONE_DAY / 2,
            start,
            prev_date,
            day_avg,
            day_sum,
            daily_min))

    
def insert_into_part(self, start, part_start, prev_date, part_sum, timezone,
                     part_type):
    part_end = start
    part_interval = part_end - part_start
    part_avg = int(round(part_sum / part_interval * 3600))
    part_middle = part_start + (part_interval / 2)
    #  Insert into the partitions table
    self.cursor.execute("""
        INSERT INTO part (
            start,
            end,
            middle,
            date,
            part_type,
            part_avg,
            part_sum)
        VALUES (?,?,?,?,?,?,?);
        """, (
            part_start,
            part_end,
            part_middle,
            prev_date,
            part_type,
            part_avg,
            part_sum))


def insert_into_hour(self, start, duration, value, watt_hours, date,
                     part_type):
    self.cursor.execute("""
    INSERT INTO hour (
        start,
        middle,
        end,
        duration,
        value,
        watt_hours,
        date,
        part_type)
    VALUES (?,?,?,?,?,?,?,?);
    """, (
        start,
        start + 1800,
        start + 3600,
        duration,
        value,
        watt_hours,
        date,
        part_type))