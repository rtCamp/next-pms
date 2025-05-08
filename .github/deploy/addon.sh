#!/bin/bash
__dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

set -x

source "$__dir/helpers.sh"

init() {
    REMOTE_HOST="${SSH_SERVER}"
    REMOTE_USER="${SSH_USER}"

    [[ "${REMOTE_HOST:-}" ]] || emergency "ENV: ${CYAN} SSH_SERVER ${ENDCOLOR} is missing."
    [[ "${REMOTE_USER:-}" ]] || emergency "ENV: ${CYAN} SSH_USER ${ENDCOLOR} is missing."
    [[ "${COMMAND:-}" ]] || emergency "ENV: ${CYAN} COMMAND ${ENDCOLOR} is missing."

    COMMAND_LINE="$COMMAND"

    if [[ "${FRAPPE_DEPLOYER_CONFIG_PATH}:-" ]]; then
        current_datetime=$(date +"%Y-%m-%d_%H-%M-%S")
        LOCAL_CONFIG_PATH="${GITHUB_WORKSPACE}/${FRAPPE_DEPLOYER_CONFIG_PATH}"
        #REMOTE_CONFIG_PATH="/tmp/$(basename ${FRAPPE_DEPLOYER_CONFIG_PATH})_${current_datatime}"
        COMMAND_LINE="${COMMAND_LINE} --config-content '$(cat ${LOCAL_CONFIG_PATH})'"
    fi

    setup_ssh
}

deploy(){
    remote_execute "/home/$REMOTE_USER/" "mkdir -p /home/$REMOTE_USER/.frappe_deployer_logs"
    remote_execute "/home/$REMOTE_USER/.frappe_deployer_logs" "/home/$REMOTE_USER/.local/bin/frappe-deployer ${COMMAND_LINE} 2>1"
}

init
deploy