(function ($) {
    $.widget('ui.scheduler', {
        options: {
            date: getLocaleDate(new Date()),
            tableWidth: 600,
            tableHeight: 200,
            timeWidth: 60,
            timeslotsPerHour: 2,
            timeslotHeight: 30,
            header: 'schedule-header',
            table: 'schedule-table',
            time_col: 'time-col',
            timeslice: 'timeslice',
            calIcon: 'images/calendar-icon.png',
            dateText: 'header-date',
            collisionBoxes: []
        },
        _divMain: 'schedule',
        _timeValues: [5, 10, 15, 30, 60],
        _midPoint: 0,
        // create basic outline
        _create: function () {
            var self = this;

            _divMain = self.element[0].id;

            $('#' + _divMain).css('width', self.options.tableWidth);
            $('#' + _divMain).append('<div id="' + self.options.header + '" style="height: 84px;"></div>');
            $('#' + _divMain).append('<div id="' + self.options.table + '" style="height: ' + self.options.tableHeight + 'px; overflow: auto;"></div>');

            var divHeader = $('#' + _divMain + ' > #' + self.options.header);

            //setup datepicker
            divHeader.append('<input type="text" id="datepicker" style="display: none;">');

            $(divHeader.selector + ' > #datepicker').datepicker({
                showOn: 'button',
                buttonImage: self.options.calIcon,
                buttonImageOnly: true,
                buttonText: 'Select Date',
                dateFormat: 'dd/mm/yy',
                onSelect: function (dateText) {
                    $(divHeader.selector + ' > #' + self.options.dateText).html(dateText);
                    self.options.date = dateText;
                    self._loadEvents();
                }
            });

            $(divHeader.selector + ' > .ui-datepicker-trigger').css({ 'width': '64px', 'height': '64px', 'margin': '10px', 'float': 'left' });

            //setup datetext
            divHeader.append('<span id="' + self.options.dateText + '" style="position: relative; top: 30px; font-size: 1.5em;">' + self.options.date + '</span>');

            //setup slider
            divHeader.append('<input type="text" id="amount" readonly style="border: 0; background: transparent; width: 4em; position: relative; top: 30px; float: right; margin: 10px;">');
            divHeader.append('<div id="slider"></div>');

            $(divHeader.selector + ' > #slider').slider({
                value: 3,
                min: 0,
                max: 4,
                start: function (event, ui) {
                    var divTable = $('#' + _divMain + ' > #' + self.options.table);
                    self._midpoint = (divTable.scrollTop() + (self.options.tableHeight / 2)) / (self.options.timeslotHeight * self.options.timeslotsPerHour);
                },
                stop: function (event, ui) {
                    $(divHeader.selector + ' > #amount').val(self._timeValues[ui.value] + ' mins');
                    self.options.timeslotsPerHour = 60 / (self._timeValues[ui.value]);
                    self._loadEvents();

                    var divTable = $('#' + _divMain + ' > #' + self.options.table);
                    divTable.scrollTop((self._midpoint * self.options.timeslotHeight * self.options.timeslotsPerHour) - (self.options.tableHeight / 2));
                }
            });

            $(divHeader.selector + ' > #amount').val(self._timeValues[$(divHeader.selector + '> #slider').slider('value')] + ' mins');

            $(divHeader.selector + ' > .ui-slider').css({ 'width': '128px', 'position': 'relative', 'top': '30px', 'float': 'right', 'margin': '10px' });

            this._loadEvents();
        },
        // load events to table
        _loadEvents: function () {
            var self = this;

            var divTable = $('#' + _divMain + ' > #' + self.options.table);
            divTable.empty();

            var tempStr;

            for (var hour = 0; hour < 24; ++hour) {
                tempStr = '<tr><td class="' + self.options.time_col + '" rowspan="' + self.options.timeslotsPerHour + '" style="width: '
					+ self.options.timeWidth + 'px; line-height: 0.5;">' + (hour < 10 ? '0' + hour + ':00' : hour + ':00') + '</td>';

                tempStr += '<td class="' + self.options.timeslice + '" style="width: ' + (self.options.tableWidth - self.options.timeWidth) + 'px; height: '
					+ self.options.timeslotHeight + 'px; position: relative; display: block;"></td></tr>';

                for (var slice = 1; slice < self.options.timeslotsPerHour; ++slice)
                    tempStr += '<tr><td class="' + self.options.timeslice + '" style="height: ' + self.options.timeslotHeight + 'px;"></td></tr>';

                divTable.append(tempStr);
            }

            var eventsArea = $(divTable.selector + ' .' + self.options.timeslice).first();
            eventsArea.empty();

            self._trigger('getEvents', null, { eventsArea: eventsArea, options: self.options });

            $('#' + _divMain + ' > #' + self.options.table).click(function (e) {
                var posX = e.pageX - $(this).offset().left + $(this).scrollLeft();
                var posY = e.pageY - $(this).offset().top + $(this).scrollTop();

                for (var i = 0; i < self.options.collisionBoxes.length; ++i) {
                    var b = self.options.collisionBoxes[i];

                    if (posX >= b.left && posX <= b.left + b.width)
                        if (posY >= b.top && posY <= b.top + b.height) {
                            //open dialog with data and update option (b.id)
                            self._trigger('getDetails', null, { id: b.id });
                            return;
                        }
                }

                //open dialog for create
                self._trigger('openEmpty', null, { date: self.options.date, hour: self._getHourFromCoord(posY) });
            });
        },
        _setOption: function (key, value) {
            var self = this;

            switch (key) {
                case 'tableWidth':
                    self.options.tableWidth = value;
                    self._loadEvents();
                    break;
                case 'timeslotsPerHour':
                    self.options.timeslotsPerHour = value;
                    self._loadEvents();
                    break;
                case 'timeslotHeight':
                    self.options.timeslotHeight = value;
                    self._loadEvents();
                    break;
            }
        },
        _getHourFromCoord: function (y) {
            var self = this;

            return parseInt(y / (self.options.timeslotHeight * self.options.timeslotsPerHour));
        },
        refresh: function () {
            this._loadEvents();
        },
        clear: function () {
            var self = this;

            var eventsArea = $('#' + _divMain + ' > #' + self.options.table + ' .' + self.options.timeslice).first();
            eventsArea.empty();
        }
    });

    function getLocaleDate(date) {
        function pad(n) {
            return (n < 10 ? '0' + n : n);
        }

        return pad(date.getDate()) + '/' + pad(date.getMonth() + 1) + '/' + date.getFullYear();
    }
})(jQuery);