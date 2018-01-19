/* requires:
    moment.min.js
    enums.js
    presets.js
*/

$(document).ready(function() {
    // datepicker
    $('.input-daterange').datepicker({
        orientation: 'bottom'
    });

    // filter presets
    $('#filter-buttons').on('click', '.btn', function(e){
        var $me = $(this),
            preset = $me.data('preset');

        usePreset(preset);
    });

    var usePreset = function(preset) {
        var config = presets[preset],
            param,
            $input;

        for (param in config) {
            var value = config[param],
                $input = $('[name="' + param + '"]');

            // select
            if ($input.is('select')) {
                $input.val(value);

            // checkbox
            } else if ($input.is('[type="checkbox"]')) {
                $input.prop('checked', false);

                if (value) {
                    for (var i=0; i<value.length; i++) {
                        $input.filter('[value="' + value[i] + '"]').prop('checked', true);
                    }
                }

            // radio
            } else if ($input.is('[type="radio"]')) {
                $input.prop('checked', false);
                $input.filter('[value="' + value + '"]').prop('checked', true);

            // text
            } else if ($input.is('input')) {
                $input.val(value);
            }
        }

        checkConfig($('form'));
    }

    $('input, select').on('change', function() {
        checkConfig($(this).closest('form'));
    });

    var checkConfig = function(form) {
        var values = $(form).serializeArray(),
            newConfig = {},
            dt = clientsDataTable.DataTable();

        values.map(function(item, i) {
            newConfig[item.name] = item.value;
        });

        dt.columns().search('');

        for (field in newConfig) {
            dt.column(field + ':name').search(newConfig[field]);
        }

        dt.draw();
    };

    // DataTables

    var booleanIcon = function(data, type, full, meta) {
        if (data === true || data === false) {
            output = '<i class="fa boolean-icon text-muted fa-' + (data ? 'check' : 'circle-thin') + '"></i>';
        } else {
            output = '<span class="boolean-icon">&mdash;</span>'
        }

        return '<div class="text-center">' + output + '</div>';
    }

    var guidRenderer = function(data, type, full, meta) {
        if (type === 'display') {
            return '<span class="text-nowrap" data-toggle="tooltip" title="' + data + '">&hellip;' + data.substr(-8) + '</span>';
        }
    }

    var typeGauge = function(data, type, full, meta) {
        var value = 0;
        var columnConfig = meta.settings.aoColumns[meta.col];
        var config;

        if(columnConfig.name === 'user_type_cj') {
            config = window.CTT_CONFIG.UTILIZATION_TYPE_JAIL;
        }
        else if(columnConfig.name === 'user_type_hmis') {
            config = window.CTT_CONFIG.UTILIZATION_TYPE_HMIS;
        }

        if(data >= config.HIGH) {
            value = 3;
        }
        else if(data >= config.MEDIUM_HIGH) {
            value = 2;
        }
        else if(data >= config.MEDIUM) {
            value = 1;
        }
        if (value >= 1 && value <= 3) {
            var diff = (3 - value),
            string = '';

            for (var i=0; i<value; i++) {
                string += '<span class="type-gauge-pip-filled"></span>';
            }
            for (var i=0; i<diff; i++) {
                string += '<span class="type-gauge-pip-empty"></span>';
            }

            return '<span class="type-gauge" data-toggle="tooltip" title="' + enums['userType'][value] + '">' + string + '</span><span class="sr-only">' + value + '</span>';
        }

        else {
            return '<span class="type-gauge-empty">&mdash;</span>';
        }
    }

    var dateRenderer = function(data, type, full, meta) {
        var date;
        if (data) {
            date = new Date(data);
            return date.toLocaleDateString();
        }

        return data;
    }

    var clientsDataTable = $('#clients');

    $('.input-daterange').keyup(function() {
        clientsDataTable.DataTable().draw();
    });

    // youth search filter
    $.fn.dataTable.ext.search.push(
        function(settings, data, dataIndex) {
            var min = 18,
                max = 24,
                age = moment().diff(data[4], 'years'),
                checkedVal = $('[name="youth_status"]:checked').val(),
                isInRange = false;

            if (checkedVal) {
                if (( isNaN( min ) && isNaN( max ) ) ||
                    ( isNaN( min ) && age <= max )   ||
                    ( min <= age   && isNaN( max ) ) ||
                    ( min <= age   && age <= max ) ) {

                    isInRange = true;
                }

                if (checkedVal == "true") {
                    return isInRange;
                } else if (checkedVal == "false") {
                    return !isInRange;
                }
            }

            // no filter because no button checked
            return true;
        }
    )

    // asc and desc sort functions to make sure non-integers are always ordered last

    $.fn.dataTable.ext.type.order['integer-asc'] = function(a, b) {
        var nanA = isNaN(a),
            nanB = isNaN(b);

        if (nanA && nanB) {
            return 0;
        } else if (nanA) {
            return 1;
        } else if (nanB) {
            return -1;
        } else {
            return a - b;
        }
    }

    $.fn.dataTable.ext.type.order['integer-desc'] = function(a, b) {
        var nanA = isNaN(a),
            nanB = isNaN(b);

        if (nanA && nanB) {
            return 0;
        } else if (nanA) {
            return 1;
        } else if (nanB) {
            return -1;
        } else {
            return b - a;
        }
    }

    var dateColumnIndex = 9;
    // date range filtering
    $.fn.dataTableExt.afnFiltering.push(
        function( oSettings, aData, iDataIndex ) {
            var start = $('[name=release_date_start]').val(),
                end = $('[name=release_date_end]').val(),
                rowDate = aData[dateColumnIndex] && new Date(aData[dateColumnIndex]) || null;

            start = start.substring(6,10) + start.substring(0,2) + start.substring(3,5);
            end = end.substring(6,10) + end.substring(0,2) + end.substring(3,5);

            if (rowDate) {
                date = `${rowDate.getFullYear()}`;
                date += rowDate.getMonth() + 1 <= 9 ? `0${rowDate.getMonth()+1}` : `${rowDate.getMonth()+1}`;
                date += rowDate.getDate() <= 0 ? `0${rowDate.getDate()}` : `${rowDate.getDate()}`;
            }

            if (start === "" && end === "" ) {
                return true;
            } else if (date === null) {
                return false;
            } else if (start <= date && end === "") {
                return true;
            } else if (end >= date && start === "") {
                return true;
            } else if (start <= date && end >= date) {
                return true;
            } else {
                return false;
            }
        }
    );

    clientsDataTable.DataTable({
        "fnDrawCallback": function() {
            $('[data-toggle="tooltip"]').tooltip();
        },
        autoWidth: false,
        serverSide: true,
        processing: true,
        ajax: {
            url: '/api/clients',
            data: function (query) {
                return {
                    draw: query.draw,
                    limit: query.length,
                    offset: query.start,
                    order: $.isArray(query.order) ? $.map(query.order, function (field) {
                        return query.columns[field.column].data+':'+field.dir;
                    }).join(',') : null
                };
            },
            dataSrc: function (payload) {
                // populated totals where DataTable expects them but provides no config to change
                payload.recordsTotal = payload.total;
                payload.recordsFiltered = payload.total;
                return payload.data;
            }
        },
        buttons: [
            {
                extend: 'csv',
                exportOptions: { orthogonal: 'export' }
            }
        ],
        dom: [
            "<'row text-muted'<'col-sm-6'i><'col-sm-6 text-right'l>>",
            "<'row'<'col-sm-12'tr>>",
            "<'row'<'col-sm-5'B><'col-sm-7'p>>"
        ].join(''),
        columnDefs: [
            {
                targets: '_all',
                defaultContent: '&mdash;',
                name: 'foo'
            },
            // {
            //     targets: [0, 1],
            //     render: guidRenderer
            // },
            {
                targets: [6, 8],
                type: 'integer',
                render: {
                    display: typeGauge
                }
            },
            {
                targets: [ 5, 7, 10, 11, 12, 13, 14, 15],
                orderable: false,
                className: 'text-center',
                render: {
                    display: booleanIcon,
                    export: function(data) {
                        return data;
                    }
                }
            }
        ],
        columns: [
            {
                data: 'id',
                name: 'hmis_id',
                title: 'HMIS'
            },
            {
                data: 'cj_id',
                name: 'cj_id',
                title: 'CJMIS'
            },
            {
                data: 'first_name',
                name: 'firstName',
                title: 'First Name'
            },
            {
                data: 'last_name',
                name: 'lastName',
                title: 'Last Name'
            },
            {
                data: 'dob',
                name: 'dob',
                title: 'DOB',
                render: function(data) {
                    if (data) {
                        var m = moment(data);
                        return '<span title="Age ' + moment().diff(data, 'years') + '" data-toggle="tooltip">'
                            + m.format('YYYY-MM-DD')
                        + '</span>';
                    } else {
                        return null;
                    }
                }
            },
            {
                data: 'currently_homeless_shelter',
                name: 'currently_homeless_shelter',
                title: 'Homeless'
            },
            {
                data: 'user_type_hmis',
                name: 'user_type_hmis',
                title: 'HMIS Use'
            },
            {
                data: 'currently_incarcerated',
                name: 'currently_incarcerated',
                title: 'In&nbsp;Jail',
            },
            {
                data: 'user_type_cj',
                name: 'user_type_cj',
                title: 'CJMIS Use'
            },
            {
                data: 'jail_release_date',
                name: 'jail_release_date',
                title: 'Release',
                className: 'text-nowrap text-center has-sorting',
                type: 'date',
                orderable: true,
                render: {
                    display: dateRenderer
                }
            },
            {
                data: 'history_unsheltered',
                name: 'history_unsheltered',
                title: '<span data-toggle="tooltip" data-placement="bottom" title="History of Unsheltered Homelessness">History</span>'
            },
            {
                data: 'chronic_status',
                name: 'chronic_status',
                title: '<span data-toggle="tooltip" title="Chronically Homeless">Chronic</span>'
            },
            {
                data: 'family_status',
                name: 'family_status',
                title: 'Family'
            },
            {
                data: 'veteran_status',
                name: 'veteran_status',
                title: 'Veteran'
            },
            {
                data: 'housing_assessment_completed',
                name: 'housing_assessment_completed',
                title: '<span data-toggle="tooltip" title="Assessment Completed">Assessed</span>'
            },
            {
                data: 'disabled_status',
                name: 'disabled_status',
                title: 'Disabled'
            },
            {
                data: 'vi_spdat',
                name: 'vi_spdat',
                title: 'VI-SPDAT',
                className: 'text-nowrap',
                type: 'integer',
                render: {
                    display: function(data, type, row, meta) {
                        var date = row.vi_spdat_assessed_date;

                        if (date && data) {
                            return '<span data-toggle="tooltip" title="Assessed ' + date + '">' + data + '</span>';
                        } else {
                            return data;
                        }
                    },
                    export: function(data, type, row, meta) {
                        var date = row.vi_spdat_assessed_date;

                        if (date && data) {
                            return data + ' (Assessed ' + date + ')';
                        } else {
                            return data;
                        }
                    }
                }
            }
        ]
    });
});