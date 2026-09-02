<%
'***************************************************************************************************
' Página     : SAT-WEB-ADF-SOL_1.ASP
' Autor      : Equipe Internet
' Data       : 16/11/2001
' Finalidade : Grava solicitação de AIDF
' Progs. IBM : 
' Sistema    : SAT
' Chama pags : 
' Banco dados: ADABAS
'** Últimas atualizações ******************************************************************
'--- Data -- Autor ----- Motivo -----------------------------------------------------------
' 21/02/2006 JCaratti    Desabilitação de Rotinas e variaveis de sessão que não está mais em uso.
' 13/03/2006 JCaratti    Habilitação de Rotinas e variaveis de sessão que foram desativadas anteriormente.
'                        Sem o Include SefTrataErros.inc a página não faz validação dos dados, 
'                        porque o programa Natural ainda não foi adaptadao para funcionar sem esta rotina.
'						(Cfe.Solic.Vaner Matos)
'22/06/2006	JCaratti	Alterações referente ao novo layout da solicitação e inclusão do campo de Email.
'25/01/2007	Andrea		Alteração no layout (texto explicativo e campo de e-mail)
'26/02/2005	Andrea		Alteração no layout e texto
'08/03/2007	Andrea		Alteração no texto final da página
'26/03/2007	Andrea		Restaurar preenchimento automático do campo observações para estabelecimentos rurais.
'*************************************************************************************************************
NomeAliasLink = "l_adf_sol"
%>
<!--#include file="../../include/SOE_Inicio.inc"-->
<!--#include file="../../include/FuncoesModalIE.inc"-->
<%
  pTicket = Request.Cookies("ticketSS")
  Set oSessaoLoginED = ObtemDadosSessaoLogin(pTicket)
%>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<meta http-equiv="Pragma" content="no-cache" />
<meta http-equiv="cache-control" content="no-cache" />
<meta http-equiv="Expires" content="-1" />
<title>SEFAZ RS/ <% if (Trim(oSessaoLoginED.IndAutEletr) = "1") then response.write ("Autorização Eletrônica - ") %>Solicitação AIDF</title>
<link rel="stylesheet" type="text/css" href="../../include/AAENOVO.css" />
<script type="text/javascript" src="../../include/SEF_Funcoes.js"></script>
<script type="text/javascript" src="../../include/HelpAIDF.js"></script>
<script type="text/javascript" src="../../include/ValidaNumeral.js"></script>
<script type="text/javascript" src="../../include/ValidaCGCTE.js"></script>
<script type="text/javascript" src="../../include/ValidaTabelaAIDF.js"></script>
<script type="text/javascript" src="../../include/ValidaPreenchimento.js"></script>
<script type="text/javascript" src="../../include/ValidaPreenchimentoSelect.js"></script>
<script type="text/javascript" src="../../include/ValidaCNPJ.js"></script>
<script src="../../../Include2/jQuery/jquery.min.js" type="text/javascript"></script>
<script type="text/javascript">
	//*********** VALIDAÇÕES DA PAGINA 1 ****************
	function valida()
	{
		//alert('#'+document.form1.desc_modeloVALUE.value+"#");
	   if( !ValidaPreenchimento( document.form1.cgctesol ) )
	   {  return false; }
	   if( !ValidaCGCTE( document.form1.cgctesol ) )
	   {  return false; }
	  // trim(document.form1.email);
	   if (document.form1.email.value!=''){
	  	  if (!checkEmail(document.form1.email)){
	  		  return false;
	  	  }
	  }
	 if (document.form1.cgctegra.value  == "" && document.form1.cnpjgra.value == "" )
	 {
	  alert( "Informe CGC/TE ou CNPJ da gráfica" ); 
	     document.form1.cgctegra.focus();
	     document.form1.cgctegra.select();
	     return false;
	 }
	 if (document.form1.cgctegra.value  != "" && document.form1.cnpjgra.value != "" )
	 {
	  alert( "Informe apenas o CGC/TE da gráfica ou o seu CNPJ, mas não ambos" ); 
	     document.form1.cgctegra.focus();
	     document.form1.cgctegra.select();
	     return false;
	 }
	 if (document.form1.cgctegra.value  != "")
	 {
	    if( !ValidaCGCTE( document.form1.cgctegra ) )
	    {  return false; }
	 }
	 if (document.form1.cnpjgra.value  != "")
	 {
	    if( !ValidaCNPJ( document.form1.cnpjgra ) )
	    {  return false; }
	 }
	//*********** VALIDAÇÕES DA PAGINA 2 ****************
	var wespecie = document.form1.especie.value;
	var wsub = document.form1.subserie.value;
	var winicial = document.form1.inicial.value * 1;
	var wfinal = document.form1.finalx.value * 1;
	var wqtde = document.form1.qtde.value;
	var wtipo = document.form1.tipo.value;
	var quant = wfinal - winicial + 1;
	if ( (wespecie !="")  || (winicial != "")  ||  (wfinal != "") ||  (wqtde != "") ||  (wtipo!='') )
	{
	   if  ( !ValidaPreenchimento(document.form1.inicial) )
	      { return false; }
	   if  ( !ValidaNumeral(document.form1.inicial) )
	      { return false; }
	   if  ( !ValidaPreenchimento(document.form1.finalx) )
	      { return false; }
	   if  ( !ValidaNumeral(document.form1.finalx) )
	      { return false; }
	   if  ( parseInt(winicial) > parseInt(wfinal) )
	      { 
	        alert("Numeração Final tem que ser maior que Inicial !");
	        document.form1.finalx.focus();
	        document.form1.finalx.select();
	        return false;
	      }
	   if  ( !ValidaPreenchimento(document.form1.qtde) )
	      { return false; }
	   if  ( !ValidaNumeral(document.form1.qtde) )
	      { return false; }
	   if  ( (wqtde != quant) )
	   { 
	     alert("Quantidade inválida");
	     document.form1.qtde.focus();
	     document.form1.qtde.select();
	     return false;
	    }
	} 
	 if ( (document.form1.especie.value=='') )
	 {
	    alert("Informe o documento fiscal"); 
	    document.form1.subserie.focus();
	    return false;
	 }
	 if (document.form1.usuarias.checked)
	{
		   x=Radio();
		  if (x==false)
		  {
		   return false;
		  }
	}
	//alert(document.descTipo.formTipo.usuarias.value);
	//var other=document.getElementById('nav').firstChild;
	 if (confirm ("Confirma a solicitação AIDF ?"))
	    {return true;}
	 else
	    {return false;}
	}
	//------------------------------------------------------------------------------------------
	function Radio()
	{
	 var erro = 0;
	 for (i=0;i<5;i++)
	 {
	     var wespecie = document.form1.especie.selectedIndex;
	     var wtipo = document.form1.tipo.selectedIndex;
	  if ( wespecie > 0)
	  {
	   if ( wtipo != 3)
	   {
	    erro = 1;
	   }
	  } 
	 }
	 if (erro==1)
	 {
	  alert("Informe inscrições usuárias somente para formulário contínuo!");
	  return false;
	 }
	 return true;
	}
	//------------------------------------------------------------------------------------------
	function selecionaTipo(posicao,valor,descricao)
	{
	   document.form1.tipo.value=valor;
	   document.form1.desc_tipo.value=descricao;
	   if(document.form1.desc_tipo.value=='Form cont'){
	      var sFormulario="";
	      retornaElemento('divTipo').style.display = '';
	      retornaElemento('divTipo').style.visibility = 'visible';		
	   }else{
	      //document.all('divTipo').innerHTML = "";
	      retornaElemento('divTipo').style.display = 'none';
		  retornaElemento('divTipo').style.visibility = 'hidden';
	   }
	 return true;
	}
	//------------------------------------------------------------------------------------------
	function ExibeDiv(Objeto,Exibe){
		if (Exibe==true){
			//Objeto.style.display='';
	        retornaElemento('divTipo').style.display = '';
	        retornaElemento('divTipo').style.visibility = 'visible';		
		}else{
			//Objeto.style.display='none';
	        retornaElemento('divTipo').style.display = "none";
		    retornaElemento('divTipo').style.visibility = 'hidden';
		}
	}
	//------------------------------------------------------------------------------------------	
	function limpCampos(posicao)
	{
	 document.form1.especie.value='';
	 document.form1.desc_especie.value='';
	 document.form1.desc_modelo.value='';
	 document.form1.subserie.value='';
	 document.form1.inicial.value='';
	 document.form1.finalx.value='';
	 document.form1.qtde.value='';
	 document.form1.tipo.value='';
	 document.form1.desc_tipo.value='';
	 document.form1.obs1.value='';
	 document.form1.obs2.value='';
	 document.form1.obs3.value='';	 
	 //document.all('divTipo').innerHTML = "";
	 //document.all['divTipo'].style.visibility="hidden";
	 retornaElemento('divTipo').style.visibility = 'hidden';
	}
	//------------------------------------------------------------------------------------------		
	function MostraBtOBS()
	{
		 str = new String(document.form1.cgctesol.value);
		 str = str.substr(3,1);
		 if (str == 1)
		 {
		 	retornaElemento('divBotaoOBS').style.display = '';
		 	retornaElemento('divBotaoOBS').style.visibility = 'visible';		
		 }
		 else
		 {
		 	retornaElemento('divBotaoOBS').style.display = 'none';
		 	retornaElemento('divBotaoOBS').style.visibility = 'hidden';		
		 }
	}
	//------------------------------------------------------------------------------------------	
	function validaHelp(){
	   if( !ValidaPreenchimento( document.form1.cgctesol ) )
	   {  return false; }
	   if( !ValidaCGCTE( document.form1.cgctesol ) )
	   {  return false; }
	   HelpAIDF(document.form1.cgctesol.value,'document.form1.especie',1,'document.form1.desc_especie','document.form1.desc_modelo','document.form1.desc_modeloVALUE',document.form1.nrosolic.value);
	}
	//------------------------------------------------------------------------------------------	
	function AbreAjuda(pPagina)
	{
	self.name = "DADOS";  
	JanAux = window.open(pPagina,'JanAux','width=445,height=460,resizeable=0,status=0,scrollbars=1,menubar=0,toolbar=0');
	}
	//------------------------------------------------------------------------------------------
	// Verifica se o e-mail é válido. Recebe um campo text e retorna true ou false
	function checkEmail(varobjtext) 
	{
		var iemail = varobjtext.value;
	  	iemail=iemail.toLowerCase();
	  	if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(iemail)&&(iemail.substring(0,3)!='www'))
	  	{
			return (true);
	  	}
	  	alert('E-mail inválido!');
	  	varobjtext.focus();
	  	varobjtext.select();
	  	return (false);
	}
	//------------------------------------------------------------------------------------------	
	function submitForm()
	{
    	document.forms[0].action = "SAT-WEB-ADF-SOL_1.asp";
    	document.forms[0].submit();
 	}
	//------------------------------------------------------------------------------------------
	function setFocus(pDIV,pOBJ)
	{
		if(retornaElemento(pDIV).style.visibility=='visible')
		{
			document.getElementById(pOBJ).focus();
		}
	}
    /* Funções para mostrar quadro de aviso e manipular cookie */
	function grava_CookieADF(chave, valor) {
	    var argv = grava_CookieADF.arguments;
	    var argc = grava_CookieADF.arguments.length;
	    var expires = (argc > 2) ? argv[2] : null;
	    var path = (argc > 3) ? argv[3] : null;
	    var domain = (argc > 4) ? argv[4] : null;
	    var secure = (argc > 5) ? argv[5] : null;
	    path = "/";
	    expires = new Date();
	    var today = new Date();
	    expires.setTime(today.getTime() + 1000 * 60 * 60 * 24 * 365);
	    document.cookie = chave + "=" + escape(valor) +
	    ((expires == null) ? "" : (";expires=" + expires.toGMTString())) +
	    ((path == null) ? "" : (";path=" + path)) +
	    ((domain == null) ? "" : (";domain=" + domain)) +
	    ((secure == true) ? ";secure" : "");
	}
	function desligaMsgADF() {
    	grava_CookieADF('DIVmsgADF', '1');
	    document.getElementById('DIVmsgADF').style.display = "none";
	}
	function FechaMsgADF() {
	    document.getElementById('DIVmsgADF').style.display = "none";
	}
	function stMsgADF() {
	    return '<%=Request.Cookies("DIVmsgADF")%>';
	}
</script>
<%
  dim sTitulo
  if (Trim(oSessaoLoginED.IndAutEletr) = "1") then 
     sTitulo = "Contabilista"
  else
  	  sTitulo = "Contribuinte"
  end if
%>
<script type="text/javascript">
var Autorizacao = true;
var botaovoltar = true;
</script>
<script type="text/javascript">var caminhoajuda = 'l_adf_sol';</script>
</head>
<body onload="setFocus('divBotaoOBS','btobs');">
  <script type="text/javascript" src="../../include/AAE_Cabecalho.js"></script>
  <form name="form1" method="post" action="SAT-WEB-ADF-SOL_3.asp">
<%if trim(request("cgctesol")) <> "" then
	If Trim(oSessaoLoginED.NroCpf) <> "" And Trim(oSessaoLoginED.NroCpf) <> "0" Then
        wMatricula  = Right("00000000000000" & Trim(oSessaoLoginED.NroCpf),14)    
    Else
        wMatricula  = Right("00000000000000" & Trim(oSessaoLoginED.NroCnpj),14)    
    End if
	wcgctesol = right("0000000000" & Request.Form("cgctesol"),10)
	'Aqui verifica Permissão no Vínculo
    If Not TemVinculoOuAutEletrNoContribuinte(Trim(wcgctesol), Trim(NomeAliasLink), Trim(oSessaoLoginED.NroCpf), Trim(oSessaoLoginED.NroCnpj)) Then
        Response.Write "<script>alert('Operador não possui permissão na IE ("& Trim(wcgctesol) &").');history.back(-1);</script>"
        Response.End
    End If
	%><!--#include file="../../include/GCIRotinas.inc"--><%
	sgciServico  = "J7SEFGCI"  
	sgciPrograma = "NLWADF07" 
	sgciSistema  = "SAT"    
	sgciDados    = wMatricula & wcgctesol & wcgctegra & wcnpj
	Set gci = CreateObject("gci470.GCIDIV")
	Result=EnvRec(sgciSistema,sgciServico,sgciPrograma,sgciTransacao,sgciDados,_
	              sgciMsgErro,igciCodErro,igciTimeOut,igciCont)
	%><!--#include file="../../include/GCITrataErros.inc"--><%
	Set gci = Nothing
	%><!--#include file="../../include/SEFTrataErros.inc" --><% 
	if Session("lerro") = 0  then  
	 	wnomes = ""
	 	j=0
	 	for i=1 to 7
	  		if trim(mid(sgciDados,71+(i-1)*46,46))<>"" then
	   			j=j+1
	   			wnomes=wnomes & j & "- " & trim(mid(sgciDados,71+(i-1)*46,46))&" "
	  		end if
	 	next
		'response.write "<script type='text/javascript'>alert("& wnomes &");</script>"
		' response.write wnomes
	end if
end if%>
    <input type="hidden" name="nrosolic" value="00000000" />
	<table width="100%" border="0" cellspacing="2" cellpadding="0">
	  <tr class="linhacabec">
		<td><b>Solicitante da AIDF</b></td>
	  </tr>
	  <tr>
		<td>
		  <table class="pagina" width="100%" cellspacing="1">
			<tr>
			  <td>
				<table border="0" cellspacing="0" cellpadding="0" width="100%">
				  <tr>
					<td nowrap="nowrap">CGC/TE</td>
					<td colspan="4">
					  <input type="text" id="cgctesol" name="cgctesol" value="<%=Request("cgctesol")%>" size="10" maxlength="10" title="Digite aqui o CGCTE do Solicitante | Tecla de atalho ALT + G" accesskey="G" onchange="limpCampos();MostraBtOBS();" onblur="limpCampos();MostraBtOBS();" />
          <%
            Call criaBotaoModalVinculosCampo(oSessaoLoginED, "cgctesol")          'Abre modal com vinculos do usuario logago
          %>
					</td>
					<!-- Módulo de Email --><!--	<tdalign="left" width="40">Email</td>
    <td>
      <input type="text" name="email" value="" align="left" size="60" maxlength="100" />
    </td>
	</tr> --><!--<tr>
   <td colspan="5">
   <table border=0 CELLSPACING=0 CELLPADDING=0 width="100%" >	
     <tr class="linhacabec"><td nowrap colspan="5"><b>Cadastre seus e-mails</b><td></tr>
	 <tr>
	   <td colspan="5">
	      <div id="txtHint">&nbsp;&nbsp;Exibe Lista de Email.</div>
	   </td>
     </tr>
     </table>
	 </td>
	-->
				  </tr>
				  <!-- Fim Módulo de Email -->
				  <tr class="linhacabec">
					<td colspan="5"><b>Estabelecimento Gr&aacute;fico</b></td>
				  </tr>
				  <tr>
					<td nowrap="nowrap">CGC/TE</td>
					<td colspan="4"><input type="text" name="cgctegra" value="<%=Request("cgctegra")%>" size="10" maxlengt h="10" /> <input type="button" name="cmdAjuda" class="botaopeq" value="..." onclick="AbreAjuda('../Tabelas/Ajuda_GraficaInt_ADF.asp');" title="Ajuda para gráfica do estado" /> </td>
				  </tr>
				  <tr>
					<td colspan="5">&nbsp;ou</td>
				  </tr>
				  <tr>
					<td>CNPJ</td>
					<td nowrap="nowrap" colspan="4"><input type="text" name="cnpjgra" value="<%=Request("cnpjgra")%>" size="14" maxlength="14" /> <input type="button" name="cmdAjuda" class="botaopeq" value="..." onclick="AbreAjuda('../Tabelas/Ajuda_GraficaExt_ADF.asp');" title="Ajuda para gráfica externa" /> &nbsp;&nbsp;<font color="#FF6600">Somente para gráfica externa</font> </td>
				  </tr>
				  <tr>
					<td colspan="5">&nbsp;</td>
				  </tr>
				  <tr>
					<td colspan="5"><!--<div style="text-align: justify;"><img src="../../Imagens/seta_dir_autoatend_famarelo.gif">&nbsp;<font face=Arial color="#FF6600"><b>A partir de 1º de outubro de 2005 somente será autorizada impressão de AIDF por gráficas credenciadas pela Receita Estadual, conforme dispõe a IN 022/05 e altera&ccedil;&eth;es.</b></font></div>-->
					  <div style="text-align: justify;">
						<img src="../../Imagens/seta_dir_autoatend_famarelo.gif" alt="" /> 
						<span style="font-size: 15px; color: #FF6600;"><b>Sr.&nbsp;&nbsp;<%=sTitulo%>:</b></span><br />
						<span style="color: #FF6600;"><br /><b>Informamos que estamos procedendo melhorias no serviço de concessão de AIDF visando agilizar e qualificar a resposta da Receita Estadual aos pedidos de AIDF. <br />Se Vossa Senhoria deseja ser informado quando a sua solicitação for processada, informe um endereço de correio eletrônico válido no campo abaixo. </b></span>
					  </div>
					</td>
				  </tr>
				  <tr>
					<td colspan="5">&nbsp;</td>
				  </tr>
				  <tr>
					<td colspan="5">E-mail&nbsp;&nbsp; <input type="text" name="email" value="<%=Request("email")%>" size="60" maxlength="100" /> </td>
				  </tr>
				  <tr>
					<td colspan="5"><span style="color: #FF6600;"><b><br />Não obstante este novo serviço de comunicação eletrônica, Vossa Senhoria deve verificar a situação da solicitação no site da Sefaz regularmente. <br />O comunicado enviado terá caráter meramente informativo, não solicitando nenhum dado ou senhas. </b></span></td>
				  </tr>
				  <tr>
					<td colspan="5">&nbsp;</td>
				  </tr>
				  <tr>
					<td colspan="5">&nbsp;</td>
				  </tr>
				  <!--
				  <tr>
					<td colspan="5">
					  <div style="text-align: justify;">
						<a href="http://sindigraf-rs.tuatecnologia.com.br/servicos_parecer.asp" target="_blank"><font size="-2">Consulte Pareceres ABIGRAF-RS</font></a></div>
					</td>
				  </tr>
				  -->
				  <tr>
					<td colspan="5">
					  <div style="text-align: justify;">
						<a href="SAT-WEB-ADF-CRE-SEL_1.asp"><font size="-2">Consulte Gr&aacute;ficas Credenciadas na Receita Estadual</font></a></div>
					</td>
				  </tr>
				</table>
			  </td>
			</tr>
			<tr>
			  <td>&nbsp;</td>
			</tr>
			<tr class="linhacabec">
			  <td>&nbsp;<b>Documento</b></td>
			</tr>
			<!-- INICIO FORMULÁRIO DA PÁGINA II-->
			<tr>
			  <td>
				<table width="100%">
				  <tr>
					<td colspan="10">
					  <table border="0" class="pagina" cellspacing="1" cellpadding="1">
						<tr>
						  <td class="menutd" width="220">Espécie</td>
						  <td class="menutd" width="20">Modelo/Serie</td>
						  <td class="menutd" width="10">&nbsp;</td>
						  <td class="menutd" width="10">Tipo</td>
						  <td class="menutd" width="15">SubSérie</td>
						  <td class="menutd" width="20">Inicial</td>
						  <td class="menutd" width="20">Final</td>
						  <td class="menutd" width="20">Qtde</td>
						  <td class="menutd" width="25">&nbsp;</td>
						</tr>
						<div id="divTable" style="visibility: visible;">
						  <tr>
						  	<td width="220"><input title="Selecione a partir do botão ..." style="background-color: white;" type="text" name="desc_especie" value="<%=Request("desc_especie")%>" size="55" readonly="readonly" /> </td>
						  	<td width="20"><input title="Selecione a partir do botão ..." style="background-color: white;" type="text" name="desc_modelo" value="<%=Request("desc_modelo")%>" size="10" readonly="readonly" /> <input type="hidden" name="desc_modeloVALUE" value="<%=Request("desc_modeloVALUE")%>" /> </td>
						  	<td width="10"><input type="button" class="botaopeq" name="cmdAjuda" value="..." onclick="validaHelp();return false;" title="Selecione Espécie" /> <input type="hidden" name="especie" value="<%=Request("especie")%>" /> </td>
						  	<td width="10"><input title="Selecione a partir do botão ..." style="background-color: white;" type="text" name="desc_tipo" value="<%=Request("desc_tipo")%>" size="6" /> <input type="hidden" name="tipo" value="<%=Request("tipo")%>" /> </td>
						  	<td width="15"><input type="text" name="subserie" value="<%=Trim(Request("subserie"))%>" size="3" maxlength="3" /> </td>
						  	<td width="20"><input type="text" name="inicial" value="<%=Request("inicial")%>" size="6" maxlength="6" /> </td>
						  	<td width="20"><input type="text" name="finalx" value="<%=Request("finalx")%>" size="6" maxlength="6" /> </td>
						  	<td width="20"><input type="text" name="qtde" value="<%=Request("qtde")%>" size="6" maxlength="6" /> </td>
						  	<td width="25"><input title="Limpar" type="button" class="button" onclick="limpCampos();" value=" L " style="width: 18px; height: 18px;" /> <input type="hidden" name="tiposaceitos" value="" /> </td>
						  </tr>
						</div>
						<tr>
						  <td colspan="9"><b>Observações</b></td>
						</tr>
						<tr>
						  <td colspan="9">
						    <input type="text" name="obs1" id="obs1" value="<%=mid(wnomes,1,70)%>" size="70" maxlength="70" style="font-family: 'Courier New', Courier, monospace;" /><br />
                            <input type="text" name="obs2" size="70" maxlength="70" value="<%=mid(wnomes,71,70)%>" style="font-family: 'Courier New', Courier, monospace;" /><br />
                            <input type="text" name="obs3" size="70" maxlength="70" value="<%=mid(wnomes,141,70)%>" style="font-family: 'Courier New', Courier, monospace;" />
                          </td>
						</tr>
						<tr>
						  <td colspan="3">
						  	<div id="divBotaoOBS" <%if trim(request("cgctesol")) <> "" and mid(trim(request("cgctesol")),4,1) = "1" then%> style="display: block; visibility: visible;" <%else%> style="display: none; visibility: hidden;" <%end if%>>
							  <input type="button" id="btobs" style="width: 285px;" onclick="submitForm();" name="Action" class="button" value="Carregar observações Produtor Primário" />
						  	</div>
						  </td>
						</tr>
						<tr>
						  <td colspan="3">
						  	<div id="divTipo" <%if trim(request("cgctesol")) <> "" and trim(request("desc_tipo")) = "Form cont" then%> style="display: block; visibility: visible;" <%else%> style="display: none; visibility: hidden;" <%end if%>>
							  <table border="0" cellspacing="0" cellpadding="0">
								<tr>
								  <td nowrap="nowrap" style="color: #FF9900;"><b>Formulário será utilizado nas demais inscrições ?</b></td>
								  <td><input style="background-color: white;" type="radio" name="usuarias" value="S" onclick="Radio();" /></td>
								  <td><b>Sim</b></td>
								  <td><input style="background-color: white;" type="radio" name="usuarias" value="N" checked="checked" /></td>
								  <td><b>Não&nbsp;</b></td>
								  <td></td>
								</tr>
							  </table>
						  	</div>
						  </td>
						</tr>
					  </table>
					</td>
				  </tr>
				</table>
			  </td>
			</tr>
		  </table>
		</td>
	  </tr>
	  <!-- FIM DO FORMULÁRIO DA PÁGINA II-->
	  <tr>
		<td><br /><input type="submit" id="btenviar" onclick="return valida();" name="Action" class="button" value="Enviar" title="Enviar" /></td>
	  </tr>
	  <tr>
		<td>&nbsp;</td>
	  </tr>
	  <tr>
		<td>
		  <div style="text-align: justify;">
<%
    'MENSAGEM DEVE SER EXCLUIDA APOS 31/12
    Dim sTmpMsg : sTmpMsg = ""
    If (Year(Now()) >= 2012) then
      sTmpMsg = "<img src=""../../Imagens/seta_dir_autoatend_famarelo.gif"" alt="""" />&nbsp;<font face=""Arial"" color=""#FF3300"">"
      sTmpMsg = sTmpMsg & "<b>Atenção: "
      If ((Month(Now())=12) AND (Day(Now()) = 31)) Then
        sTmpMsg = sTmpMsg & "HOJE (31/12/2012)"
      Else
        sTmpMsg = sTmpMsg & "Em 31/12/2012"
      End If
      If (Year(Now()) > 2012) Then
        sTmpMsg = sTmpMsg & " se encerraram"
      Else
        sTmpMsg = sTmpMsg & " se encerram"
      End If
      sTmpMsg = sTmpMsg & " as dispensas para emissão de Nota Fiscal Eletrônica para Contribuinte do SN, vigentes com base no faturamento.</b><br>"
      sTmpMsg = sTmpMsg & "</font><br></div>"
    End If
 %>				  
      <%=sTmpMsg %>
			<img src="../../Imagens/seta_dir_autoatend_famarelo.gif" alt="" />&nbsp;<font face="Arial" color="#FF6600">Aten&ccedil;&atilde;o: As solicita&ccedil;&otilde;es a serem atendidas por for&ccedil;a de decis&atilde;o judicial devem ser encaminhadas pessoalmente, na reparti&ccedil;&atilde;o fazend&aacute;ria a qual se vincula o estabelecimento, fazendo-se acompanhar do correspondente of&iacute;cio expedido pelo Poder Judici&aacute;rio, sem preju&iacute;zo da documenta&ccedil;&atilde;o restante a ser apresentada em cada caso, com previs&atilde;o na legisla&ccedil;&atilde;o tribut&aacute;ria e processual aplic&aacute;vel. (IN DRP 45/98, T&iacute;tulo I, Cap&iacute;tulo XI, subitem 1.1.1.1 letra "c")</font></div>
		</td>
	  </tr>
	</table>
  </form>
  <script type="text/javascript" src="../../include/AAE_Fim.js"></script>
</body>
</html>