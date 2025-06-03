#!/usr/bin/env bash
# Exit on error. Append "|| true" if you expect an error.
set -o errexit
# Exit on error inside any functions or subshells.
set -o errtrace
# Do not allow use of undefined vars. Use ${VAR:-} to use an undefined VAR
set -o nounset
# Catch the error in case mysqldump fails (but gzip succeeds) in `mysqldump |gzip`
set -o pipefail
# Turn on traces, useful while debugging but commented out by default
# set -o xtrace

# Define the environment variables (and their defaults) that this script depends on
LOG_LEVEL="${LOG_LEVEL:-6}" # 7 = debug -> 0 = emergency
NO_COLOR="${NO_COLOR:-}"    # true = disable color. otherwise autodetected

RED="\033[31m"
GREEN="\033[32m"
CYAN="\033[36m"
YELLOW='\033[0;33m'
BLUE="\033[34m"
ENDCOLOR="\033[0m"

### Functions
##############################################################################

function __log () {
  local log_level="${1}"
  shift

  # shellcheck disable=SC2034
  local color_debug="\\x1b[35m"
  # shellcheck disable=SC2034
  local color_info="\\x1b[32m"
  # shellcheck disable=SC2034
  local color_notice="\\x1b[34m"
  # shellcheck disable=SC2034
  local color_warning="\\x1b[33m"
  # shellcheck disable=SC2034
  local color_error="\\x1b[31m"
  # shellcheck disable=SC2034
  local color_critical="\\x1b[1;31m"
  # shellcheck disable=SC2034
  local color_alert="\\x1b[1;37;41m"
  # shellcheck disable=SC2034
  local color_emergency="\\x1b[1;4;5;37;41m"

  local colorvar="color_${log_level}"

  local color="${!colorvar:-${color_error}}"
  local color_reset="\\x1b[0m"

  if [[ "${NO_COLOR:-}" = "true" ]] || { [[ "${TERM:-}" != "xterm"* ]] && [[ "${TERM:-}" != "screen"* ]]; } || [[ ! -t 2 ]]; then
    if [[ "${NO_COLOR:-}" != "false" ]]; then
      # Don't use colors on pipes or non-recognized terminals
      color=""; color_reset=""
    fi
  fi

  # all remaining arguments are to be printed
  local log_line=""

  while IFS=$'\n' read -r log_line; do
    width=9
    padding=$(( ($width - ${#log_level}) / 2 ))
    echo -e "$(date -u +"%Y-%m-%d %H:%M:%S UTC") ${color}$(printf "[%${padding}s%s%${padding}s]" "" "${log_level}" "" )${color_reset} ${log_line}" 1>&2
  done <<< "${@:-}"
}

function emergency () {                                __log emergency "${@}"; exit 1; }
function alert ()     { [[ "${LOG_LEVEL:-0}" -ge 1 ]] && __log alert "${@}"; true; }
function critical ()  { [[ "${LOG_LEVEL:-0}" -ge 2 ]] && __log critical "${@}"; true; }
function error ()     { [[ "${LOG_LEVEL:-0}" -ge 3 ]] && __log error "${@}"; true; }
function warn ()   { [[ "${LOG_LEVEL:-0}" -ge 4 ]] && __log warning "${@}"; true; }
function notice ()    { [[ "${LOG_LEVEL:-0}" -ge 5 ]] && __log notice "${@}"; true; }
function info ()      { [[ "${LOG_LEVEL:-0}" -ge 6 ]] && __log info "${@}"; true; }
function debug ()     { [[ "${LOG_LEVEL:-0}" -ge 7 ]] && __log debug "${@}"; true; }


function check_command_status () {
    if [ "$?" -gt "$1" ]; then
        emergency "$2"
    else
        info "$3"
    fi
}

remote_execute() {

    [[ "${REMOTE_USER}" ]] || emergency "REMOTE_USER not found."
    [[ "${REMOTE_HOST}" ]] || emergency "REMOTE_USER not found."

    path=$(echo "$1")
    cmd=$(echo "$2")

    ssh -o StrictHostKeyChecking=no "${REMOTE_USER}"@"${REMOTE_HOST}" "cd $path && $cmd"

}

setup_ssh() {

  # used for saving private key
	SSH_DIR="$HOME/.ssh"
	mkdir -p "$SSH_DIR"
	chmod 700 "$SSH_DIR"

  [[ "${SSH_PRIVATE_KEY:-}" ]] || emergency "SSH_PRIVATE_KEY is not set."

	if [[ -n "$SSH_PRIVATE_KEY" ]]; then
		echo "$SSH_PRIVATE_KEY" | tr -d '\r' > "$SSH_DIR/id_rsa"
		chmod 600 "$SSH_DIR/id_rsa"
		eval "$(ssh-agent -s)"
		ssh-add "$SSH_DIR/id_rsa"

cat > /etc/ssh/ssh_config <<EOL
Host $REMOTE_HOST
HostName $REMOTE_HOST
IdentityFile ${SSH_DIR}/id_rsa
User $REMOTE_USER
EOL


  fi
}

construct_ps4() {
    local func_stack=""
    local last_func=""
    for ((i=1; i<=${#FUNCNAME[@]}-1; i++)); do
        # Avoid repeating the same function name (like 'main') in the stack
        if [[ "${FUNCNAME[$i]}" != "$last_func" ]]; then
            func_stack+="${FUNCNAME[$i]} <- "
            last_func="${FUNCNAME[$i]}"
        fi
    done
    # Remove the trailing ' -> ' if any
    func_stack=${func_stack% <- }
    echo "$func_stack"
}

export PS4="${RED}+\${BASH_SUBSHELL}> ${GREEN}\$(basename \${BASH_SOURCE}):${RED}\${LINENO}${BLUE} - ${YELLOW}\$(construct_ps4)\n${BLUE}"