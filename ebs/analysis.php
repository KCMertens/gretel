<?php
session_cache_limiter('private');
session_start();
header('Content-Type:text/html; charset=utf-8');
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

$currentPage = 'ebs';
$step = 7;

require "../config.php";
require ROOT_PATH . "/helpers.php";

require ROOT_PATH . "/front-end-includes/metadata.php";
retrieve_metadata();

$_SESSION['ebsxps'] = $currentPage;
$id = session_id();

$continueConstraints = sessionVariablesSet(array('treebank', 'queryid', 'example', 'subtreebank', 'xpath'));

if ($continueConstraints)
{
	require ROOT_PATH . "/preparatory-scripts/prep-functions.php";

	$treeVisualizer = true;
	$onlyFullscreenTv = true;
	$corpus = $_SESSION['treebank'];
	$components = $_SESSION['subtreebank'];
	$xpath = $_SESSION['originalXp'] . get_metadata_filter();
	$originalXp = $_SESSION['originalXp'];

	// Need to clean in case the user goes back in history, otherwise the
	// prepended slashes below would keep stacking on each back-and-forward
	// in history
	$xpath = cleanXpath($xpath);
	$originalXp = cleanXpath($originalXp);
	$example = $_SESSION['example'];

	$context = $_SESSION['ct'];
	$_SESSION['endPosIteration'] = 0;
	$_SESSION['startDatabases'] = array();
	if ($corpus == 'sonar')
	{
		$databaseExists = false;
	}

	$needRegularSonar = false;
}

session_write_close();

require ROOT_PATH . "/functions.php";
require ROOT_PATH . "/front-end-includes/head.php";

if ($continueConstraints)
{
	require ROOT_PATH . "/basex-search-scripts/treebank-search.php";
	require ROOT_PATH . "/basex-search-scripts/basex-client.php";
	session_start();
	if ($corpus == 'sonar')
	{
		$bf = xpathToBreadthFirst($xpath);
		// Get correct databases to start search with, sets to
		// $_SESSION['startDatabases']
		checkBfPattern($bf);

		// When looking in the regular version we need the double slash to go through
		// all descendants
		if ($needRegularSonar)
		{
			$xpath = "//$xpath";
			$originalXp = "//$originalXp";
		}
		else
		{
			$xpath = "/$xpath";
			$originalXp = "/$originalXp";
		}
	}
	else
	{
		$xpath = "//$xpath";
		$originalXp = "//$originalXp";
		$_SESSION['startDatabases'] = corpusToDatabase($components, $corpus);
	}

	session_write_close();
}
?>

<?php flush(); ?>
<?php
require ROOT_PATH . "/front-end-includes/header.php";
?>
<div id="output"></div>
<?php
if ($continueConstraints)
{
	setContinueNavigation();
}
require ROOT_PATH . "/front-end-includes/footer.php";
include ROOT_PATH . "/front-end-includes/analytics-tracking.php";
?>

<link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/pivottable/2.11.0/pivot.min.css">
<script src="//cdnjs.cloudflare.com/ajax/libs/pivottable/2.11.0/pivot.min.js"></script>
<script src="//cdnjs.cloudflare.com/ajax/libs/pivottable/2.6.0/tips_data.min.js"></script>

<script>
	var API = '<?= API_URL; ?>';
	var CORPUS = '<?= $corpus; ?>';
</script>

<script>
	$(function () {
		var utils = $.pivotUtilities;
		var heatmap = utils.renderers["Heatmap"];

		var metadata_fields = [];
		$.get(API + '/treebank/metadata/' + CORPUS, function (data) {
			$.each(data, function (i, value) {
				metadata_fields.push(value.field);
			});
		}).done(function () {
			$.ajax('basex-search-scripts/get-all-results.php')
					.done(function (json) {
						var data = $.parseJSON(json);
						if (!data.error && data.data) {
							var m_list = [];
							var pos_list = [];
							var lemmata_list = [];
							$.each(data.data, function (i, value) {
								var metadata = $($.parseXML("<metadata>" + value[3] + "</metadata>"));
								var mv = [];
								var m = {};
								$.each(metadata.find('meta'), function (j, v) {
									m[$(v).attr('name')] = $(v).attr('value');
								});
								$.each(metadata_fields, function (j, v) {
									mv.push(m[v]);
								});
								m_list.push(mv);

								var nodes = $($.parseXML(value[4]));
								var lemmata = [];
								var pos = [];
								$.each(nodes.find('node'), function (j, v) {
									var attr = $(v).attr('pos');
									if (attr) {
										pos.push(attr);
									}

									var attr = $(v).attr('lemma');
									if (attr) {
										lemmata.push(attr);
									}
								});
								pos_list.push(pos);
								lemmata_list.push(lemmata);
							});

							console.log(pos_list);


							var longest = pos_list.sort(function (a, b) {
								return b.length - a.length;
							})[0].length;

							for (var i = 1; i <= longest; i++) {
								metadata_fields.push('pos' + i);
							}
							for (var i = 1; i <= longest; i++) {
								metadata_fields.push('lem' + i);
							}

							var pivotData = [metadata_fields];

							$.each(m_list, function (i, m) {
								var line = [];

								line.push.apply(line, m_list[i]);
								var p = pos_list[i];
								while (p.length < longest) {
									p.push('(none)');
								}
								line.push.apply(line, pos_list[i]);
								var l = lemmata_list[i];
								while (l.length < longest) {
									l.push('(none)');
								}
								line.push.apply(line, lemmata_list[i]);

								pivotData.push(line);
							});


							$("#output").pivotUI(
									pivotData, {
										rows: [],
										cols: [],
										renderer: heatmap
									});
						} else {
							/* $(".loading-wrapper.searching").removeClass("active");
							 messages.children("div").removeClass("error notice").closest(".results-messages-wrapper").show();
							 downloadWrapper.addClass("active");
							 if (data.error) {
							 messageOnError(data.data);
							 } else if (resultsWrapper.find("tbody:not(.empty)").children().length == 0) {
							 messageNoResultsFound();
							 }*/
						}
					})
					.fail(function (jqXHR, textStatus, error) {
						// Edge triggers a fail when an XHR request is aborted
						// We don't want that, so if the error message is abort, ignore
						if (error != 'abort') {
							var string = "An error occurred: " + error + ".";
							messageOnError(string);
						}
					})
					.always(function () {
						done = true;
						//if (xhrFetchSentences)
						//xhrFetchSentences.abort();
					});
		});
	});
</script>

</body>
</html>
