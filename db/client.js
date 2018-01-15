'use strict';


module.exports = (sequelize, DataTypes) => {
    const Client = sequelize.define('Client', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },
        dedup_client_id: {
            type: DataTypes.STRING,
            unique: true
        },
        first_name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'Please provide client\'s first name',
                },
                len: {
                    args: 1,
                    msg: 'First Name must be at least 1 characters in length'
                }
            }
        },
        last_name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'Please provide client\'s last name',
                },
                len: {
                    args: 1,
                    msg: 'Name must be at least 1 characters in length'
                }
            }
        },
        chronic_status: DataTypes.BOOLEAN,
        currently_homeless_shelter: DataTypes.BOOLEAN,
        currently_incarcerated: DataTypes.BOOLEAN,
        disabled_status: DataTypes.BOOLEAN,
        family_status: DataTypes.BOOLEAN,
        history_unsheltered: DataTypes.BOOLEAN,
        jail_release_date: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        disabling_condition: DataTypes.BOOLEAN,

        // TODO: use enum?
        user_type_hmis: DataTypes.INTEGER,
        user_type_cj: DataTypes.INTEGER,

        veteran_status: DataTypes.BOOLEAN,
        vi_spdat: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        active_ces: DataTypes.BOOLEAN,
        assigned_navigator: DataTypes.BOOLEAN,
        currently_homeless_program: DataTypes.BOOLEAN,
        homeless_history: DataTypes.DECIMAL(2, 1),
        housing_assessment_completed: DataTypes.BOOLEAN,
        housing_navigator: {
            type: DataTypes.STRING,
            allowNull: true
        },
        jail_facility_name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        match_initiation_completed: {
            type: DataTypes.BOOLEAN,
            allowNull: true
        },
        matched_psh_rrh: DataTypes.BOOLEAN,
        recommended_intervention: {
            type: DataTypes.STRING,
            allowNull: true
        },
        year_last_cj_interaction: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        dob: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        vi_spdat_assessed_date: {
            type: DataTypes.DATEONLY,
            allowNull: true
        }
    }, {
        timestamps: true,
        paranoid: true,
        underscored: true
    });

    return Client;
};