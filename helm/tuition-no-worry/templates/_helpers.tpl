{{- define "tuition-no-worry.fullname" -}}
{{- printf "%s" .Chart.Name -}}
{{- end -}}

{{- define "tuition-no-worry.labels" -}}
app.kubernetes.io/name: {{ include "tuition-no-worry.fullname" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}
