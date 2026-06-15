CREATE TABLE "expenseManager".user_roles (
    role_id UUID DEFAULT gen_random_uuid() NOT NULL,
    role_name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    CONSTRAINT user_roles_pkey PRIMARY KEY (role_id),
    CONSTRAINT user_roles_role_name_key UNIQUE (role_name)
);


CREATE TABLE "expenseManager".user_credentials (
	user_id uuid DEFAULT gen_random_uuid() NOT NULL,
	username varchar(100) NOT NULL,
	email varchar(255) NOT NULL,
	current_password varchar(255) NOT NULL,
	role_id uuid NOT NULL,
	is_active bool DEFAULT true NOT NULL,
	is_locked bool DEFAULT false NOT NULL,
	failed_login_attempts int4 DEFAULT 0 NOT NULL,
	last_login_at timestamp NULL,
	password_updated_at timestamp NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	first_name varchar(50) NOT NULL,
	last_name varchar(50) DEFAULT ''::character varying NULL,
	display_name varchar(24) NULL,
	CONSTRAINT user_credentials_email_key UNIQUE (email),
	CONSTRAINT user_credentials_pkey PRIMARY KEY (user_id),
	CONSTRAINT user_credentials_username_key UNIQUE (username),
	CONSTRAINT fk_user_credentials_role FOREIGN KEY (role_id) REFERENCES "expenseManager".user_roles(role_id)
);

CREATE TABLE "expenseManager".password_history (
    password_history_id UUID DEFAULT gen_random_uuid() NOT NULL,
    user_id UUID NOT NULL,
    last_password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT password_history_pkey PRIMARY KEY (password_history_id),
    CONSTRAINT fk_password_history_user
        FOREIGN KEY (user_id)
        REFERENCES "expenseManager".user_credentials(user_id)
);
